import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse, paginatedResponse, getPaginationParams } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export const bookmarkRouter = Router();
bookmarkRouter.use(authenticate);

// GET /api/bookmarks — User's bookmarks
bookmarkRouter.get('/', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { collectionId } = req.query;

    const where: any = { userId: req.user!.id };
    if (collectionId) where.collectionId = collectionId;

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          resource: {
            include: {
              subject: { select: { name: true } },
              branch: { select: { shortName: true } },
              uploader: { select: { firstName: true, lastName: true } },
            },
          },
          collection: { select: { name: true } },
        },
      }),
      prisma.bookmark.count({ where }),
    ]);

    paginatedResponse(res, bookmarks, total, page, limit);
  } catch (err) {
    next(err);
  }
});

// GET /api/bookmarks/collections — User's bookmark collections
bookmarkRouter.get('/collections', async (req: AuthRequest, res: any, next: any) => {
  try {
    const collections = await prisma.bookmarkCollection.findMany({
      where: { userId: req.user!.id },
      include: { _count: { select: { bookmarks: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    successResponse(res, collections, 'Collections fetched');
  } catch (err) {
    next(err);
  }
});

// POST /api/bookmarks/collections — Create collection
bookmarkRouter.post('/collections', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { name, description } = req.body;
    const collection = await prisma.bookmarkCollection.create({
      data: { name, description, userId: req.user!.id },
    });
    successResponse(res, collection, 'Collection created', 201);
  } catch (err) {
    next(err);
  }
});

// POST /api/bookmarks — Add bookmark
bookmarkRouter.post('/', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { resourceId, collectionId } = req.body;
    const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
    if (!resource) throw new AppError('Resource not found', 404);

    const bookmark = await prisma.bookmark.upsert({
      where: { resourceId_userId: { resourceId, userId: req.user!.id } },
      create: { resourceId, userId: req.user!.id, collectionId },
      update: { collectionId },
    });

    await prisma.resource.update({
      where: { id: resourceId },
      data: { bookmarkCount: { increment: 1 } },
    });

    successResponse(res, bookmark, 'Bookmarked', 201);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/bookmarks/:resourceId — Remove bookmark
bookmarkRouter.delete('/:resourceId', async (req: AuthRequest, res: any, next: any) => {
  try {
    await prisma.bookmark.delete({
      where: { resourceId_userId: { resourceId: (req.params.resourceId as string), userId: req.user!.id } },
    });
    await prisma.resource.update({
      where: { id: (req.params.resourceId as string) },
      data: { bookmarkCount: { decrement: 1 } },
    });
    successResponse(res, null, 'Bookmark removed');
  } catch (err) {
    next(err);
  }
});
