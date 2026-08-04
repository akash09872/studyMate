import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
import { successResponse, paginatedResponse, getPaginationParams } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export const commentRouter = Router();

// GET /api/comments/resource/:id
commentRouter.get('/resource/:id', optionalAuth, async (req: AuthRequest, res: any, next: any) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { resourceId: (req.params.id as string), parentId: null, isDeleted: false },
        skip,
        take: limit,
        orderBy: { likeCount: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, level: true } },
          replies: {
            where: { isDeleted: false },
            include: {
              user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'asc' },
            take: 10,
          },
          _count: { select: { likes: true, replies: true } },
        },
      }),
      prisma.comment.count({ where: { resourceId: (req.params.id as string), parentId: null, isDeleted: false } }),
    ]);

    paginatedResponse(res, comments, total, page, limit);
  } catch (err) {
    next(err);
  }
});

// POST /api/comments
commentRouter.post('/', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const { resourceId, content, parentId } = req.body;
    if (!content?.trim()) throw new AppError('Comment content is required', 400);

    const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
    if (!resource || resource.status !== 'APPROVED') throw new AppError('Resource not found', 404);

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.resourceId !== resourceId) throw new AppError('Invalid parent comment', 400);
    }

    const comment = await prisma.comment.create({
      data: { resourceId, userId: req.user!.id, content: content.trim(), parentId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, level: true } },
      },
    });

    successResponse(res, comment, 'Comment posted', 201);
  } catch (err) {
    next(err);
  }
});

// PUT /api/comments/:id — Edit comment
commentRouter.put('/:id', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: (req.params.id as string) } });
    if (!comment) throw new AppError('Comment not found', 404);
    if (comment.userId !== req.user!.id) throw new AppError('You can only edit your own comments', 403);

    const updated = await prisma.comment.update({
      where: { id: (req.params.id as string) },
      data: { content: req.body.content, isEdited: true },
    });
    successResponse(res, updated, 'Comment updated');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/comments/:id — Soft delete
commentRouter.delete('/:id', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: (req.params.id as string) } });
    if (!comment) throw new AppError('Comment not found', 404);
    if (comment.userId !== req.user!.id && req.user!.role === 'STUDENT') {
      throw new AppError('Permission denied', 403);
    }
    await prisma.comment.update({
      where: { id: (req.params.id as string) },
      data: { isDeleted: true, content: '[deleted]' },
    });
    successResponse(res, null, 'Comment deleted');
  } catch (err) {
    next(err);
  }
});

// POST /api/comments/:id/like — Toggle like
commentRouter.post('/:id/like', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const existing = await prisma.commentLike.findFirst({
      where: { commentId: (req.params.id as string), userId: req.user!.id },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      await prisma.comment.update({ where: { id: (req.params.id as string) }, data: { likeCount: { decrement: 1 } } });
      successResponse(res, { liked: false }, 'Like removed');
    } else {
      await prisma.commentLike.create({ data: { commentId: (req.params.id as string), userId: req.user!.id } });
      await prisma.comment.update({ where: { id: (req.params.id as string) }, data: { likeCount: { increment: 1 } } });
      successResponse(res, { liked: true }, 'Liked');
    }
  } catch (err) {
    next(err);
  }
});
