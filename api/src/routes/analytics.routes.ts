import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { successResponse, paginatedResponse, getPaginationParams } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate, authorize('ADMIN', 'FACULTY'));

// GET /api/analytics/overview — Dashboard overview stats
analyticsRouter.get('/overview', async (req: AuthRequest, res: any, next: any) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, newUsersToday, newUsersWeek, newUsersMonth,
      totalResources, pendingResources, approvedResources, rejectedResources,
      totalDownloads, totalBadgesAwarded,
      topSubjects, recentActivity,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.resource.count(),
      prisma.resource.count({ where: { status: 'PENDING' } }),
      prisma.resource.count({ where: { status: 'APPROVED' } }),
      prisma.resource.count({ where: { status: 'REJECTED' } }),
      prisma.download.count(),
      prisma.userBadge.count(),
      prisma.resource.groupBy({
        by: ['subjectId'],
        where: { status: 'APPROVED' },
        _count: true,
        orderBy: { _count: { subjectId: 'desc' } },
        take: 5,
      }),
      prisma.resource.findMany({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, type: true, createdAt: true, downloadCount: true },
      }),
    ]);

    successResponse(res, {
      users: { total: totalUsers, today: newUsersToday, week: newUsersWeek, month: newUsersMonth },
      resources: { total: totalResources, pending: pendingResources, approved: approvedResources, rejected: rejectedResources },
      downloads: totalDownloads,
      badgesAwarded: totalBadgesAwarded,
      topSubjects,
      recentActivity,
    }, 'Analytics overview');
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/upload-trends — Upload count over time
analyticsRouter.get('/upload-trends', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const resources = await prisma.resource.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const grouped: Record<string, { uploads: number; approved: number }> = {};
    resources.forEach((r) => {
      const day = r.createdAt.toISOString().split('T')[0];
      if (!grouped[day]) grouped[day] = { uploads: 0, approved: 0 };
      grouped[day].uploads++;
      if (r.status === 'APPROVED') grouped[day].approved++;
    });

    const trends = Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
    successResponse(res, trends, 'Upload trends');
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/top-resources
analyticsRouter.get('/top-resources', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { by = 'downloads', limit = 10 } = req.query;
    const orderBy = by === 'rating' ? { averageRating: 'desc' as const }
      : by === 'views' ? { viewCount: 'desc' as const }
      : { downloadCount: 'desc' as const };

    const resources = await prisma.resource.findMany({
      where: { status: 'APPROVED' },
      orderBy,
      take: parseInt(limit as string),
      select: {
        id: true, title: true, type: true, downloadCount: true,
        viewCount: true, averageRating: true, ratingCount: true,
        subject: { select: { name: true } },
        branch: { select: { shortName: true } },
      },
    });
    successResponse(res, resources, 'Top resources');
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/branch-stats
analyticsRouter.get('/branch-stats', async (req: AuthRequest, res: any, next: any) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: { users: true, resources: true },
        },
      },
    });
    successResponse(res, branches, 'Branch stats');
  } catch (err) {
    next(err);
  }
});
