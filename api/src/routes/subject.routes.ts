import { Router } from 'express';
import { prisma } from '../prisma/client';
import { successResponse } from '../utils/response';

export const subjectRouter = Router();

subjectRouter.get('/', async (req: any, res: any, next: any) => {
  try {
    const { branchId, semesterId } = req.query;
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (semesterId) where.semesterId = semesterId;
    const subjects = await prisma.subject.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    successResponse(res, subjects, 'Subjects');
  } catch (err) { next(err); }
});
