import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { successResponse, paginatedResponse, getPaginationParams } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { awardPoints } from '../services/gamification.service';
import { createNotification } from '../services/notification.service';
import { sendApprovalEmail } from '../utils/email';

export const reviewRouter = Router();

// All review routes require FACULTY or ADMIN
reviewRouter.use(authenticate, authorize('FACULTY', 'ADMIN'));

// GET /api/review/queue — Pending resources for review
reviewRouter.get('/queue', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { branchId, type } = req.query;

    const where: any = { status: 'PENDING' };

    // Faculty sees their dept; admin sees all
    if (req.user!.role === 'FACULTY') {
      const faculty = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { branchId: true } });
      if (faculty?.branchId) where.branchId = faculty.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }
    if (type) where.type = type;

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          uploader: { select: { id: true, firstName: true, lastName: true, collegeId: true, avatarUrl: true } },
          subject: { select: { name: true, code: true } },
          branch: { select: { name: true, shortName: true } },
          semester: { select: { number: true } },
          tags: { select: { name: true } },
        },
      }),
      prisma.resource.count({ where }),
    ]);

    paginatedResponse(res, resources, total, page, limit);
  } catch (err) {
    next(err);
  }
});

// GET /api/review/:id — Get single pending resource
reviewRouter.get('/:id', async (req: AuthRequest, res: any, next: any) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: (req.params.id as string) },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true, collegeId: true, avatarUrl: true, level: true } },
        subject: { select: { name: true, code: true } },
        branch: { select: { name: true } },
        semester: { select: { number: true } },
        tags: { select: { name: true } },
      },
    });
    if (!resource) throw new AppError('Resource not found', 404);
    successResponse(res, resource, 'Resource fetched');
  } catch (err) {
    next(err);
  }
});

// POST /api/review/:id/approve
reviewRouter.post('/:id/approve', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { note, isFeatured, facultyPick } = req.body;
    const resource = await prisma.resource.findUnique({
      where: { id: (req.params.id as string) },
      include: { uploader: { select: { email: true, firstName: true } } },
    });
    if (!resource) throw new AppError('Resource not found', 404);
    if (resource.status !== 'PENDING') throw new AppError('Resource is not pending review', 400);

    const updated = await prisma.resource.update({
      where: { id: (req.params.id as string) },
      data: {
        status: 'APPROVED',
        isVerified: true,
        reviewerId: req.user!.id,
        reviewNote: note,
        reviewedAt: new Date(),
        isFeatured: isFeatured || false,
        facultyPick: facultyPick || false,
      },
    });

    // Award points to uploader
    await awardPoints(resource.uploaderId, 'UPLOAD_APPROVED', `Resource "${resource.title}" approved`);
    if (facultyPick) {
      await awardPoints(resource.uploaderId, 'FACULTY_PICK', `Faculty picked "${resource.title}"`);
    }

    // Notify uploader
    await createNotification(
      resource.uploaderId,
      'RESOURCE_APPROVED',
      '✅ Resource Approved!',
      `"${resource.title}" has been approved and is now live.`,
      `/resources/${resource.id}`
    );

    // Send email
    await sendApprovalEmail(resource.uploader.email, resource.title, true, note);

    successResponse(res, updated, 'Resource approved successfully');
  } catch (err) {
    next(err);
  }
});

// POST /api/review/:id/reject
reviewRouter.post('/:id/reject', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { reason } = req.body;
    if (!reason) throw new AppError('Rejection reason is required', 400);

    const resource = await prisma.resource.findUnique({
      where: { id: (req.params.id as string) },
      include: { uploader: { select: { email: true } } },
    });
    if (!resource) throw new AppError('Resource not found', 404);

    const updated = await prisma.resource.update({
      where: { id: (req.params.id as string) },
      data: {
        status: 'REJECTED',
        reviewerId: req.user!.id,
        reviewNote: reason,
        reviewedAt: new Date(),
      },
    });

    await createNotification(
      resource.uploaderId,
      'RESOURCE_REJECTED',
      '❌ Resource Rejected',
      `"${resource.title}" was rejected. Reason: ${reason}`,
      `/resources/my`
    );
    await sendApprovalEmail(resource.uploader.email, resource.title, false, reason);

    successResponse(res, updated, 'Resource rejected');
  } catch (err) {
    next(err);
  }
});

// POST /api/review/:id/request-changes
reviewRouter.post('/:id/request-changes', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { changes } = req.body;
    if (!changes) throw new AppError('Changes description is required', 400);

    const resource = await prisma.resource.findUnique({ where: { id: (req.params.id as string) } });
    if (!resource) throw new AppError('Resource not found', 404);

    await prisma.resource.update({
      where: { id: (req.params.id as string) },
      data: {
        status: 'CHANGES_REQUESTED',
        reviewerId: req.user!.id,
        reviewNote: changes,
        reviewedAt: new Date(),
      },
    });

    await createNotification(
      resource.uploaderId,
      'RESOURCE_CHANGES_REQUESTED',
      '🔄 Changes Requested',
      `"${resource.title}": ${changes}`,
      `/resources/my`
    );

    successResponse(res, null, 'Changes requested');
  } catch (err) {
    next(err);
  }
});
