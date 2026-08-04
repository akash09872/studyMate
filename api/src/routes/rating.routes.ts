import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { awardPoints } from '../services/gamification.service';

export const ratingRouter = Router();

// POST /api/ratings — Submit rating
ratingRouter.post('/', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const { resourceId, rating, review } = req.body;
    if (rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5', 400);

    const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
    if (!resource || resource.status !== 'APPROVED') throw new AppError('Resource not found', 404);
    if (resource.uploaderId === req.user!.id) throw new AppError('You cannot rate your own resource', 400);

    const existing = await prisma.rating.findFirst({
      where: { resourceId, userId: req.user!.id },
    });

    const ratingRecord = await prisma.rating.upsert({
      where: existing
        ? { id: existing.id }
        : { resourceId_userId: { resourceId, userId: req.user!.id } },
      create: { resourceId, userId: req.user!.id, rating, review },
      update: { rating, review },
    });

    // Recalculate average rating
    const stats = await prisma.rating.aggregate({
      where: { resourceId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        averageRating: stats._avg.rating || 0,
        ratingCount: stats._count,
      },
    });

    // Award points to uploader if high rating received
    if (rating >= 4 && !existing) {
      await awardPoints(resource.uploaderId, 'RATING_RECEIVED', `High rating on "${resource.title}"`);
    }

    successResponse(res, ratingRecord, existing ? 'Rating updated' : 'Rating submitted', 201);
  } catch (err) {
    next(err);
  }
});

// GET /api/ratings/resource/:id — Get ratings for resource
ratingRouter.get('/resource/:id', async (req: any, res: any, next: any) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { resourceId: (req.params.id as string) },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true, level: true } },
      },
      orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    });

    const stats = await prisma.rating.aggregate({
      where: { resourceId: (req.params.id as string) },
      _avg: { rating: true },
      _count: true,
    });

    // Distribution breakdown
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r) => { distribution[r.rating]++; });

    successResponse(res, { ratings, stats, distribution }, 'Ratings fetched');
  } catch (err) {
    next(err);
  }
});
