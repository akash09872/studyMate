import { Router } from 'express';
import { prisma } from '../prisma/client';
import { successResponse } from '../utils/response';

export const leaderboardRouter = Router();

// GET /api/leaderboard?period=OVERALL|WEEKLY|MONTHLY&branchId=xxx
leaderboardRouter.get('/', async (req: any, res: any, next: any) => {
  try {
    const { period = 'OVERALL', branchId, limit = 50 } = req.query;
    const take = Math.min(100, parseInt(limit as string));

    const where: any = {};
    if (branchId) where.branchId = branchId as string;

    let users;
    if (period === 'OVERALL') {
      users = await prisma.user.findMany({
        where: { role: 'STUDENT', isActive: true, ...where },
        orderBy: { totalPoints: 'desc' },
        take,
        select: {
          id: true, firstName: true, lastName: true, collegeId: true,
          avatarUrl: true, totalPoints: true, level: true, contributionScore: true,
          currentStreak: true, branch: { select: { name: true, shortName: true } },
          currentSemester: true,
          _count: { select: { resources: true } },
          badges: { take: 3, include: { badge: { select: { iconUrl: true, name: true } } } },
        },
      });
    } else {
      // Weekly/Monthly from leaderboard_entries cache
      const periodKey = period === 'WEEKLY'
        ? getWeekKey(new Date())
        : getMonthKey(new Date());

      const entries = await prisma.leaderboardEntry.findMany({
        where: { period: period as string, periodKey },
        orderBy: { rank: 'asc' },
        take,
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, collegeId: true,
              avatarUrl: true, level: true, branch: { select: { shortName: true } },
              badges: { take: 2, include: { badge: { select: { iconUrl: true } } } },
            },
          },
        },
      });
      users = entries;
    }

    successResponse(res, users, 'Leaderboard fetched');
  } catch (err) {
    next(err);
  }
});

const getWeekKey = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

const getMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
