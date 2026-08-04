import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse, paginatedResponse, getPaginationParams } from '../utils/response';

export const notificationRouter = Router();
notificationRouter.use(authenticate);

// GET /api/notifications
notificationRouter.get('/', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { unread } = req.query;
    const where: any = { userId: req.user!.id };
    if (unread === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
    ]);

    res.json({ success: true, data: notifications, unreadCount, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read
notificationRouter.put('/:id/read', async (req: AuthRequest, res: any, next: any) => {
  try {
    await prisma.notification.updateMany({
      where: { id: (req.params.id as string), userId: req.user!.id },
      data: { isRead: true },
    });
    successResponse(res, null, 'Marked as read');
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/read-all
notificationRouter.put('/read-all', async (req: AuthRequest, res: any, next: any) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    successResponse(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notifications/:id
notificationRouter.delete('/:id', async (req: AuthRequest, res: any, next: any) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: (req.params.id as string), userId: req.user!.id },
    });
    successResponse(res, null, 'Notification deleted');
  } catch (err) {
    next(err);
  }
});
