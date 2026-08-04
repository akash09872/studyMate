import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { successResponse, paginatedResponse, getPaginationParams } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export const reportRouter = Router();

// POST /api/reports — Submit report
reportRouter.post('/', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const { resourceId, commentId, reason, description } = req.body;
    if (!resourceId && !commentId) throw new AppError('Provide resourceId or commentId', 400);

    await prisma.report.create({
      data: { reporterId: req.user!.id, reason, description, resourceId, commentId },
    });
    successResponse(res, null, 'Report submitted. Our team will review it.', 201);
  } catch (err) {
    next(err);
  }
});

// GET /api/reports — Admin/Faculty: list reports
reportRouter.get('/', authenticate, authorize('ADMIN', 'FACULTY'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status } = req.query;

    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { firstName: true, lastName: true } },
          resource: { select: { id: true, title: true } },
          comment: { select: { id: true, content: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    paginatedResponse(res, reports, total, page, limit);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/reports/:id/resolve
reportRouter.patch('/:id/resolve', authenticate, authorize('ADMIN', 'FACULTY'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const { status, resolution } = req.body;
    await prisma.report.update({
      where: { id: (req.params.id as string) },
      data: { status, resolution, resolvedBy: req.user!.id, resolvedAt: new Date() },
    });
    successResponse(res, null, 'Report resolved');
  } catch (err) {
    next(err);
  }
});
