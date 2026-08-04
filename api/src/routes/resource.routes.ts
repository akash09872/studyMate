import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, AuthRequest, authorize, optionalAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { successResponse, paginatedResponse, getPaginationParams } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { generateSlug } from '../utils/jwt';
import { awardPoints } from '../services/gamification.service';
import { createNotification } from '../services/notification.service';

export const resourceRouter = Router();

// GET /api/resources — List with filters
resourceRouter.get('/', optionalAuth, async (req: AuthRequest, res: any, next: any) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const {
      branchId, semesterId, subjectId, type, status,
      search, sortBy = 'createdAt', order = 'desc',
      facultyPick, isVerified, uploaderId,
    } = req.query;

    const where: any = { status: 'APPROVED' };
    if (status && req.user?.role !== 'STUDENT') where.status = status;
    if (branchId) where.branchId = branchId;
    if (semesterId) where.semesterId = semesterId;
    if (subjectId) where.subjectId = subjectId;
    if (type) where.type = type;
    if (facultyPick === 'true') where.facultyPick = true;
    if (isVerified === 'true') where.isVerified = true;
    if (uploaderId) where.uploaderId = uploaderId;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { some: { name: { contains: search as string, mode: 'insensitive' } } } },
      ];
    }

    const orderBy: any = {};
    const validSortFields = ['createdAt', 'downloadCount', 'viewCount', 'averageRating', 'title'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
    orderBy[sortField as string] = order === 'asc' ? 'asc' : 'desc';

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          subject: { select: { name: true, code: true } },
          branch: { select: { name: true, shortName: true } },
          semester: { select: { number: true } },
          uploader: { select: { id: true, firstName: true, lastName: true, collegeId: true, avatarUrl: true } },
          tags: { select: { name: true } },
          _count: { select: { comments: true, bookmarks: true, ratings: true } },
        },
      }),
      prisma.resource.count({ where }),
    ]);

    paginatedResponse(res, resources, total, page, limit);
  } catch (err) {
    next(err);
  }
});

// GET /api/resources/:id — Single resource
resourceRouter.get('/:id', optionalAuth, async (req: AuthRequest, res: any, next: any) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id as string },
      include: {
        subject: { select: { name: true, code: true } },
        branch: { select: { name: true, shortName: true } },
        semester: { select: { number: true } },
        uploader: { select: { id: true, firstName: true, lastName: true, collegeId: true, avatarUrl: true, level: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
        tags: { select: { name: true } },
        ratings: {
          take: 5,
          orderBy: { helpfulCount: 'desc' },
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
        _count: { select: { comments: true, bookmarks: true, ratings: true, downloads: true } },
      },
    });

    if (!resource) throw new AppError('Resource not found', 404);
    if (resource.status !== 'APPROVED' && req.user?.role === 'STUDENT' && resource.uploaderId !== req.user?.id) {
      throw new AppError('Resource not available', 403);
    }

    // Track view
    if (req.user) {
      await prisma.resource.update({
        where: { id: resource.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    // Check if bookmarked by current user
    let isBookmarked = false;
    let userRating = null;
    if (req.user) {
      const [bm, rt] = await Promise.all([
        prisma.bookmark.findFirst({ where: { resourceId: resource.id, userId: req.user.id } }),
        prisma.rating.findFirst({ where: { resourceId: resource.id, userId: req.user.id } }),
      ]);
      isBookmarked = !!bm;
      userRating = rt;
    }

    successResponse(res, { ...resource, isBookmarked, userRating }, 'Resource fetched');
  } catch (err) {
    next(err);
  }
});

// POST /api/resources — Upload new resource
resourceRouter.post(
  '/',
  authenticate,
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      if (!files?.file?.[0]) throw new AppError('File is required', 400);

      const { title, description, type, subjectId, branchId, semesterId, unit, author, tags } = req.body;

      // Validate subject belongs to branch+semester
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, branchId, semesterId },
      });
      if (!subject) throw new AppError('Invalid subject, branch, or semester combination', 400);

      const file = files.file[0];
      const thumbnail = files.thumbnail?.[0];
      const slug = generateSlug(title);

      const parsedTags: string[] = tags
        ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()))
        : [];

      const resource = await prisma.resource.create({
        data: {
          title,
          slug,
          description,
          type,
          subjectId,
          branchId,
          semesterId,
          unit,
          author,
          uploaderId: req.user!.id,
          fileUrl: `/uploads/files/${file.filename}`,
          fileKey: file.filename,
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          thumbnailUrl: thumbnail ? `/uploads/thumbnails/${thumbnail.filename}` : null,
          tags: {
            create: parsedTags.map((name) => ({ name: name.toLowerCase() })),
          },
        },
        include: { tags: true, subject: true, branch: true, semester: true },
      });

      // Notify faculty of new pending resource
      const facultyUsers = await prisma.user.findMany({
        where: { role: 'FACULTY', branchId },
        select: { id: true },
      });
      await Promise.all(
        facultyUsers.map((f) =>
          createNotification(f.id, 'RESOURCE_APPROVED', 'New Resource Pending Review',
            `"${title}" needs your review`, `/faculty/review/${resource.id}`)
        )
      );

      successResponse(res, resource, 'Resource uploaded successfully! Pending faculty review.', 201);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/resources/:id/download — Track download
resourceRouter.post('/:id/download', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const id = req.params.id as string;
    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource || resource.status !== 'APPROVED') throw new AppError('Resource not found', 404);

    await Promise.all([
      prisma.download.upsert({
        where: { id: `${req.user!.id}-${id}` },
        create: { resourceId: id, userId: req.user!.id },
        update: { createdAt: new Date() },
      }).catch(() =>
        prisma.download.create({ data: { resourceId: id, userId: req.user!.id } })
      ),
      prisma.resource.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      }),
    ]);

    // Check download milestones (100, 500, 1000)
    const newCount = resource.downloadCount + 1;
    if ([100, 500, 1000].includes(newCount)) {
      await createNotification(
        resource.uploaderId,
        'DOWNLOAD_MILESTONE',
        `🎉 ${newCount} Downloads!`,
        `"${resource.title}" just hit ${newCount} downloads!`,
        `/resources/${resource.id}`
      );
    }

    successResponse(res, { fileUrl: resource.fileUrl, fileName: resource.fileName }, 'Download tracked');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/resources/:id — Soft delete
resourceRouter.delete('/:id', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const resource = await prisma.resource.findUnique({ where: { id: (req.params.id as string) } });
    if (!resource) throw new AppError('Resource not found', 404);

    if (resource.uploaderId !== req.user!.id && req.user!.role === 'STUDENT') {
      throw new AppError('You can only delete your own resources', 403);
    }

    await prisma.resource.update({
      where: { id: (req.params.id as string) },
      data: { status: 'DRAFT' },
    });

    successResponse(res, null, 'Resource removed');
  } catch (err) {
    next(err);
  }
});
