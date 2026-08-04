import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { successResponse, paginatedResponse, getPaginationParams } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { createNotification } from '../services/notification.service';

export const assignmentRouter = Router();

// GET /api/assignments — List assignments (filtered by branch/semester)
assignmentRouter.get('/', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { subjectId, branchId, semesterId } = req.query;

    const where: any = {};
    if (subjectId) where.subjectId = subjectId;
    if (branchId) where.branchId = branchId;

    // For faculty, show their own assignments; for students, filter by their branch/semester
    if (req.user!.role === 'FACULTY') where.facultyId = req.user!.id;

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: { select: { name: true, code: true } },
          branch: { select: { name: true } },
          faculty: { select: { firstName: true, lastName: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.assignment.count({ where }),
    ]);

    paginatedResponse(res, assignments, total, page, limit);
  } catch (err) {
    next(err);
  }
});

// GET /api/assignments/:id — Single assignment
assignmentRouter.get('/:id', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: (req.params.id as string) },
      include: {
        subject: { select: { name: true, code: true } },
        branch: { select: { name: true } },
        faculty: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    if (!assignment) throw new AppError('Assignment not found', 404);

    // Get student's own submission
    let mySubmission = null;
    let submissions: any[] = [];
    if (req.user!.role === 'STUDENT') {
      mySubmission = await prisma.assignmentSubmission.findFirst({
        where: { assignmentId: assignment.id, studentId: req.user!.id },
      });

      // Show all submissions only if deadline passed and faculty enabled it
      if (assignment.showSubmissions && new Date() > assignment.deadline) {
        submissions = await prisma.assignmentSubmission.findMany({
          where: { assignmentId: assignment.id },
          include: {
            student: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
          orderBy: [{ isBest: 'desc' }, { submittedAt: 'asc' }],
        });
      }
    } else if (['FACULTY', 'ADMIN'].includes(req.user!.role)) {
      submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId: assignment.id },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, collegeId: true } },
        },
        orderBy: [{ isBest: 'desc' }, { submittedAt: 'asc' }],
      });
    }

    successResponse(res, { ...assignment, mySubmission, submissions }, 'Assignment fetched');
  } catch (err) {
    next(err);
  }
});

// POST /api/assignments — Create assignment (faculty only)
assignmentRouter.post(
  '/',
  authenticate,
  authorize('FACULTY', 'ADMIN'),
  upload.array('attachments', 5),
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const { title, description, deadline, marks, subjectId, branchId } = req.body;
      const files = req.files as Express.Multer.File[];
      const attachmentUrls = files?.map((f) => `/uploads/files/${f.filename}`) || [];

      const subject = await prisma.subject.findUnique({ where: { id: subjectId }, select: { semesterId: true } });
      if (!subject) throw new AppError('Subject not found', 400);

      const assignment = await prisma.assignment.create({
        data: {
          title,
          description,
          deadline: new Date(deadline),
          marks: parseInt(marks),
          subjectId,
          branchId,
          facultyId: req.user!.id,
          attachmentUrls,
        },
        include: { subject: true, branch: true },
      });

      // Notify students
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT', branchId },
        select: { id: true },
      });
      await Promise.all(
        students.map((s) =>
          createNotification(
            s.id, 'ASSIGNMENT_CREATED', '📝 New Assignment',
            `"${title}" posted in ${subject.semesterId}. Deadline: ${new Date(deadline).toLocaleDateString()}`,
            `/assignments/${assignment.id}`
          )
        )
      );

      successResponse(res, assignment, 'Assignment created', 201);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/assignments/:id/submit — Student submission
assignmentRouter.post(
  '/:id/submit',
  authenticate,
  authorize('STUDENT'),
  upload.single('file'),
  async (req: AuthRequest, res: any, next: any) => {
    try {
      if (!req.file) throw new AppError('Submission file required', 400);
      const assignment = await prisma.assignment.findUnique({ where: { id: (req.params.id as string) } });
      if (!assignment) throw new AppError('Assignment not found', 404);
      if (new Date() > assignment.deadline) throw new AppError('Submission deadline has passed', 400);

      const submission = await prisma.assignmentSubmission.upsert({
        where: { assignmentId_studentId: { assignmentId: (req.params.id as string), studentId: req.user!.id } },
        create: {
          assignmentId: (req.params.id as string),
          studentId: req.user!.id,
          fileUrl: `/uploads/files/${req.file.filename}`,
          fileKey: req.file.filename,
          fileName: req.file.originalname,
          remarks: req.body.remarks,
        },
        update: {
          fileUrl: `/uploads/files/${req.file.filename}`,
          fileKey: req.file.filename,
          fileName: req.file.originalname,
          remarks: req.body.remarks,
        },
      });

      successResponse(res, submission, 'Submission uploaded successfully', 201);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/assignments/:id/highlight/:submissionId — Mark best submission
assignmentRouter.patch(
  '/:id/highlight/:submissionId',
  authenticate,
  authorize('FACULTY', 'ADMIN'),
  async (req: AuthRequest, res: any, next: any) => {
    try {
      await prisma.assignmentSubmission.updateMany({
        where: { assignmentId: (req.params.id as string) },
        data: { isBest: false },
      });
      const submission = await prisma.assignmentSubmission.update({
        where: { id: (req.params.submissionId as string) },
        data: { isBest: true },
        include: { student: true },
      });
      await createNotification(
        submission.studentId, 'BADGE_EARNED', '🌟 Best Submission!',
        'Your submission was highlighted by the faculty!', `/assignments/${(req.params.id as string)}`
      );
      successResponse(res, submission, 'Best submission marked');
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/assignments/:id/publish — Toggle submission visibility
assignmentRouter.patch(
  '/:id/publish',
  authenticate,
  authorize('FACULTY', 'ADMIN'),
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const assignment = await prisma.assignment.findUnique({ where: { id: (req.params.id as string) } });
      if (!assignment) throw new AppError('Assignment not found', 404);
      const updated = await prisma.assignment.update({
        where: { id: (req.params.id as string) },
        data: { showSubmissions: !assignment.showSubmissions },
      });
      successResponse(res, updated, `Submissions ${updated.showSubmissions ? 'made visible' : 'hidden'}`);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/assignments/:id - Delete assignment
assignmentRouter.delete(
  '/:id',
  authenticate,
  authorize('FACULTY', 'ADMIN'),
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const assignment = await prisma.assignment.findUnique({ where: { id: (req.params.id as string) } });
      if (!assignment) throw new AppError('Assignment not found', 404);
      
      if (req.user!.role !== 'ADMIN' && assignment.facultyId !== req.user!.id) {
        throw new AppError('Not authorized to delete this assignment', 403);
      }

      await prisma.assignment.delete({ where: { id: (req.params.id as string) } });
      successResponse(res, null, 'Assignment deleted successfully');
    } catch (err) {
      next(err);
    }
  }
);
