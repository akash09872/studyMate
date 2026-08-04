import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { avatarUpload } from '../middleware/upload';
import { successResponse, paginatedResponse, getPaginationParams } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import path from 'path';

export const userRouter = Router();

// GET /api/users/profile/:id — Public profile
userRouter.get('/profile/:id', async (req: any, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req.params.id as string) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        collegeId: true,
        avatarUrl: true,
        bio: true,
        role: true,
        totalPoints: true,
        level: true,
        contributionScore: true,
        reputationScore: true,
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
        branch: { select: { name: true, shortName: true } },
        currentSemester: true,
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
          take: 6,
        },
        achievements: {
          include: { achievement: true },
          orderBy: { earnedAt: 'desc' },
          take: 6,
        },
        _count: {
          select: {
            resources: true,
            downloads: true,
            bookmarks: true,
            badges: true,
          },
        },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    successResponse(res, user, 'Profile fetched');
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/profile — Update own profile
userRouter.put('/profile', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const { firstName, lastName, bio, currentSemester, branchId, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { firstName, lastName, bio, currentSemester, branchId, phone },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        collegeId: true, bio: true, currentSemester: true, avatarUrl: true,
      },
    });
    successResponse(res, user, 'Profile updated');
  } catch (err) {
    next(err);
  }
});

// POST /api/users/avatar — Upload avatar
userRouter.post(
  '/avatar',
  authenticate,
  avatarUpload.single('avatar'),
  async (req: AuthRequest, res: any, next: any) => {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatarUrl },
      });
      successResponse(res, { avatarUrl }, 'Avatar updated');
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/users/stats/:id — Contribution stats
userRouter.get('/stats/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const [uploadStats, downloadStats, ratingStats, pointHistory] = await Promise.all([
      prisma.resource.groupBy({
        by: ['status'],
        where: { uploaderId: id },
        _count: true,
      }),
      prisma.download.count({ where: { resource: { uploaderId: id } } }),
      prisma.rating.aggregate({
        where: { resource: { uploaderId: id } },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.pointTransaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    successResponse(res, { uploadStats, downloadStats, ratingStats, pointHistory }, 'Stats fetched');
  } catch (err) {
    next(err);
  }
});

// GET /api/users/activity/:id — Recent activity
userRouter.get('/activity/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const [resources, badges, achievements] = await Promise.all([
      prisma.resource.findMany({
        where: { uploaderId: id, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        select: { id: true, title: true, type: true, createdAt: true, slug: true },
      }),
      prisma.userBadge.findMany({
        where: { userId: id },
        include: { badge: { select: { name: true, iconUrl: true, rarity: true } } },
        orderBy: { earnedAt: 'desc' },
        take: 5,
      }),
      prisma.userAchievement.findMany({
        where: { userId: id },
        include: { achievement: { select: { name: true, iconUrl: true } } },
        orderBy: { earnedAt: 'desc' },
        take: 5,
      }),
    ]);

    successResponse(res, { resources, badges, achievements }, 'Activity fetched');
  } catch (err) {
    next(err);
  }
});


