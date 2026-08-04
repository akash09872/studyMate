import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { successResponse, paginatedResponse, getPaginationParams } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export const adminRouter = Router();
adminRouter.use(authenticate, authorize('ADMIN'));

// ─── Branch Management ────────────────────────────────────────────────────────
adminRouter.get('/branches', async (req: any, res: any, next: any) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: { select: { users: true, subjects: true, resources: true } },
        semesters: { orderBy: { number: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
    successResponse(res, branches, 'Branches');
  } catch (err) { next(err); }
});

adminRouter.post('/branches', async (req: any, res: any, next: any) => {
  try {
    const { name, shortName, description } = req.body;
    const branch = await prisma.branch.create({ data: { name, shortName, description } });
    // Auto-create 8 semesters
    await prisma.semester.createMany({
      data: Array.from({ length: 8 }, (_, i) => ({ number: i + 1, branchId: branch.id })),
    });
    successResponse(res, branch, 'Branch created', 201);
  } catch (err) { next(err); }
});

adminRouter.put('/branches/:id', async (req: any, res: any, next: any) => {
  try {
    const updated = await prisma.branch.update({
      where: { id: (req.params.id as string) },
      data: req.body,
    });
    successResponse(res, updated, 'Branch updated');
  } catch (err) { next(err); }
});

// ─── Subject Management ───────────────────────────────────────────────────────
adminRouter.get('/subjects', async (req: any, res: any, next: any) => {
  try {
    const { branchId, semesterId } = req.query;
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (semesterId) where.semesterId = semesterId;
    const subjects = await prisma.subject.findMany({
      where,
      include: {
        branch: { select: { shortName: true } },
        semester: { select: { number: true } },
        _count: { select: { resources: true } },
      },
      orderBy: { name: 'asc' },
    });
    successResponse(res, subjects, 'Subjects');
  } catch (err) { next(err); }
});

adminRouter.post('/subjects', async (req: any, res: any, next: any) => {
  try {
    const { name, code, description, credits, branchId, semesterId } = req.body;
    const subject = await prisma.subject.create({
      data: { name, code, description, credits: parseInt(credits), branchId, semesterId },
    });
    successResponse(res, subject, 'Subject created', 201);
  } catch (err) { next(err); }
});

adminRouter.put('/subjects/:id', async (req: any, res: any, next: any) => {
  try {
    const updated = await prisma.subject.update({ where: { id: (req.params.id as string) }, data: req.body });
    successResponse(res, updated, 'Subject updated');
  } catch (err) { next(err); }
});

adminRouter.delete('/subjects/:id', async (req: any, res: any, next: any) => {
  try {
    await prisma.subject.update({ where: { id: (req.params.id as string) }, data: { isActive: false } });
    successResponse(res, null, 'Subject deactivated');
  } catch (err) { next(err); }
});

// ─── Badge Management ─────────────────────────────────────────────────────────
adminRouter.get('/badges', async (req: any, res: any, next: any) => {
  try {
    const badges = await prisma.badge.findMany({
      include: { _count: { select: { userBadges: true } } },
      orderBy: { createdAt: 'desc' },
    });
    successResponse(res, badges, 'Badges');
  } catch (err) { next(err); }
});

adminRouter.post('/badges', async (req: any, res: any, next: any) => {
  try {
    const { name, description, iconUrl, rarity, criteria, points } = req.body;
    const badge = await prisma.badge.create({
      data: { name, description, iconUrl, rarity, criteria, points: parseInt(points) },
    });
    successResponse(res, badge, 'Badge created', 201);
  } catch (err) { next(err); }
});

adminRouter.put('/badges/:id', async (req: any, res: any, next: any) => {
  try {
    const updated = await prisma.badge.update({ where: { id: (req.params.id as string) }, data: req.body });
    successResponse(res, updated, 'Badge updated');
  } catch (err) { next(err); }
});

// ─── Resource Management ──────────────────────────────────────────────────────
adminRouter.get('/resources', async (req: any, res: any, next: any) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, type, branchId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (branchId) where.branchId = branchId;

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          uploader: { select: { firstName: true, lastName: true, collegeId: true } },
          subject: { select: { name: true } },
          branch: { select: { shortName: true } },
        },
      }),
      prisma.resource.count({ where }),
    ]);
    paginatedResponse(res, resources, total, page, limit);
  } catch (err) { next(err); }
});

adminRouter.delete('/resources/:id', async (req: any, res: any, next: any) => {
  try {
    await prisma.resource.delete({ where: { id: (req.params.id as string) } });
    successResponse(res, null, 'Resource deleted');
  } catch (err) { next(err); }
});

// ─── System Settings ──────────────────────────────────────────────────────────
adminRouter.get('/system-stats', async (req: any, res: any, next: any) => {
  try {
    const [userCount, resourceCount, downloadCount, commentCount, reportCount] = await Promise.all([
      prisma.user.count(),
      prisma.resource.count(),
      prisma.download.count(),
      prisma.comment.count({ where: { isDeleted: false } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    successResponse(res, {
      users: userCount, resources: resourceCount,
      downloads: downloadCount, comments: commentCount,
      pendingReports: reportCount,
    }, 'System stats');
  } catch (err) { next(err); }
});

// GET /api/admin/audit-logs
adminRouter.get('/audit-logs', async (req: any, res: any, next: any) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      prisma.auditLog.count(),
    ]);
    paginatedResponse(res, logs, total, page, limit);
  } catch (err) { next(err); }
});

// ─── User Management ──────────────────────────────────────────────────────────
adminRouter.get('/users', async (req: any, res: any, next: any) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { role, search, branchId } = req.query;

    const where: any = {};
    if (role) where.role = role;
    if (branchId) where.branchId = branchId;
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { collegeId: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true, collegeId: true,
          role: true, isActive: true, emailVerified: true, totalPoints: true, level: true,
          createdAt: true, branch: { select: { name: true, shortName: true } },
          _count: { select: { resources: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    paginatedResponse(res, users, total, page, limit);
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/users/:id/toggle', async (req: any, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: (req.params.id as string) } });
    if (!user) throw new AppError('User not found', 404);
    const updated = await prisma.user.update({
      where: { id: (req.params.id as string) },
      data: { isActive: !user.isActive },
    });
    successResponse(res, { isActive: updated.isActive }, `User ${updated.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/users/:id/role', async (req: any, res: any, next: any) => {
  try {
    const { role } = req.body;
    if (!['STUDENT', 'FACULTY', 'ADMIN'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }
    const updated = await prisma.user.update({
      where: { id: (req.params.id as string) },
      data: { role },
    });
    successResponse(res, { role: updated.role }, 'User role updated');
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/users/:id', async (req: any, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: (req.params.id as string) } });
    if (!user) throw new AppError('User not found', 404);
    
    await prisma.user.delete({
      where: { id: (req.params.id as string) }
    });
    
    successResponse(res, null, 'User deleted completely');
  } catch (err) {
    next(err);
  }
});
