import { Router } from 'express';
import { body, param } from 'express-validator';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateOTP,
} from '../utils/jwt';
import { sendOTPEmail } from '../utils/email';
import { successResponse } from '../utils/response';
import { validate } from '../middleware/validate';

export const authRouter = Router();

// ─── Register ─────────────────────────────────────────────────────────────────
authRouter.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('collegeId').trim().isLength({ min: 3 }).matches(/^[a-zA-Z0-9_-]+$/),
    body('role').isIn(['STUDENT', 'FACULTY']),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { email, password, firstName, lastName, collegeId, role, branchId, enrollmentNo } = req.body;

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { collegeId }] },
      });
      if (existing) {
        throw new AppError('Email or College ID already taken', 409);
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          collegeId,
          role,
          branchId: branchId || null,
          enrollmentNo: enrollmentNo || null,
          emailVerified: true,
        },
      });

      // Create default bookmark collection
      await prisma.bookmarkCollection.create({
        data: { userId: user.id, name: 'Saved Resources', isDefault: true },
      });

      // Create notification preferences
      await prisma.notificationPreference.create({ data: { userId: user.id } });

      successResponse(
        res,
        { userId: user.id, email: user.email },
        'Registration successful!',
        201
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── Verify Email ─────────────────────────────────────────────────────────────
authRouter.post('/verify-email', async (req: any, res: any, next: any) => {
  try {
    const { email, otp } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code: otp,
        type: 'EMAIL_VERIFY',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });
    if (!otpRecord) throw new AppError('Invalid or expired OTP', 400);

    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { isUsed: true } });

    successResponse(res, null, 'Email verified successfully! You can now log in.');
  } catch (err) {
    next(err);
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
authRouter.post(
  '/login',
  [body('collegeId').notEmpty(), body('password').notEmpty()],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { collegeId, password } = req.body;

      const user = await prisma.user.findFirst({
        where: { 
          OR: [
            { collegeId: collegeId.trim() },
            { email: collegeId.trim() }
          ]
        },
      });
      if (!user) throw new AppError('Invalid credentials', 401);
      if (!user.isActive) throw new AppError('Account deactivated. Contact support.', 403);

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) throw new AppError('Invalid credentials', 401);

      // Update last login & streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.streak.upsert({
        where: { userId_date: { userId: user.id, date: today } },
        create: { userId: user.id, date: today },
        update: {},
      });
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

      const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ id: user.id });

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        },
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      successResponse(res, {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          collegeId: user.collegeId,
          avatarUrl: user.avatarUrl,
        },
      }, 'Login successful');
    } catch (err) {
      next(err);
    }
  }
);

// ─── Refresh Token ────────────────────────────────────────────────────────────
authRouter.post('/refresh', async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) throw new AppError('Refresh token required', 401);

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) throw new AppError('User not found', 401);

    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    successResponse(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
authRouter.post('/logout', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { isRevoked: true },
      });
    }
    res.clearCookie('refreshToken');
    successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
authRouter.post('/forgot-password', async (req: any, res: any, next: any) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Don't reveal if email exists
    if (user) {
      const otp = generateOTP();
      await prisma.otpCode.create({
        data: {
          userId: user.id,
          code: otp,
          type: 'PASSWORD_RESET',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
      await sendOTPEmail(email, otp, 'reset');
    }
    successResponse(res, null, 'If an account exists, a reset OTP has been sent.');
  } catch (err) {
    next(err);
  }
});

// ─── Reset Password ───────────────────────────────────────────────────────────
authRouter.post('/reset-password', async (req: any, res: any, next: any) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Invalid request', 400);

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code: otp,
        type: 'PASSWORD_RESET',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });
    if (!otpRecord) throw new AppError('Invalid or expired OTP', 400);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { isUsed: true } });
    await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { isRevoked: true } });

    successResponse(res, null, 'Password reset successfully. Please log in.');
  } catch (err) {
    next(err);
  }
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
authRouter.get('/me', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        collegeId: true,
        avatarUrl: true,
        bio: true,
        branchId: true,
        currentSemester: true,
        enrollmentNo: true,
        totalPoints: true,
        level: true,
        contributionScore: true,
        reputationScore: true,
        currentStreak: true,
        longestStreak: true,
        emailVerified: true,
        createdAt: true,
        branch: { select: { name: true, shortName: true } },
        _count: {
          select: { resources: true, downloads: true, bookmarks: true },
        },
      },
    });
    successResponse(res, user, 'User fetched');
  } catch (err) {
    next(err);
  }
});

// ─── Change Password ──────────────────────────────────────────────────────────
authRouter.post('/change-password', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('User not found', 404);

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { isRevoked: true } });
    res.clearCookie('refreshToken');

    successResponse(res, null, 'Password changed successfully. Please log in again.');
  } catch (err) {
    next(err);
  }
});
