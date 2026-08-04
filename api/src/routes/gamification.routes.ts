import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse } from '../utils/response';

export const gamificationRouter = Router();

// GET /api/gamification/badges
gamificationRouter.get('/badges', async (req: any, res: any, next: any) => {
  try {
    const badges = await prisma.badge.findMany({
      where: { isActive: true },
      orderBy: [{ rarity: 'asc' }, { name: 'asc' }],
    });
    successResponse(res, badges, 'Badges fetched');
  } catch (err) {
    next(err);
  }
});

// GET /api/gamification/my-badges
gamificationRouter.get('/my-badges', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const badges = await prisma.userBadge.findMany({
      where: { userId: req.user!.id },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
    successResponse(res, badges, 'Your badges');
  } catch (err) {
    next(err);
  }
});

// GET /api/gamification/points
gamificationRouter.get('/points', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [transactions, total, user] = await Promise.all([
      prisma.pointTransaction.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.pointTransaction.count({ where: { userId: req.user!.id } }),
      prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { totalPoints: true, level: true, contributionScore: true, reputationScore: true },
      }),
    ]);

    successResponse(res, { transactions, total, user }, 'Points history');
  } catch (err) {
    next(err);
  }
});

// GET /api/gamification/achievements
gamificationRouter.get('/achievements', async (req: any, res: any, next: any) => {
  try {
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { xpReward: 'desc' },
    });
    successResponse(res, achievements, 'Achievements');
  } catch (err) {
    next(err);
  }
});

// GET /api/gamification/challenges
gamificationRouter.get('/challenges', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const now = new Date();
    const challenges = await prisma.challenge.findMany({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      include: {
        userChallenges: {
          where: { userId: req.user!.id },
          select: { progress: true, isCompleted: true },
        },
      },
    });
    successResponse(res, challenges, 'Challenges');
  } catch (err) {
    next(err);
  }
});
