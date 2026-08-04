import { Router } from 'express';
import { prisma } from '../prisma/client';
import { successResponse } from '../utils/response';

export const branchRouter = Router();

branchRouter.get('/', async (req: any, res: any, next: any) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
      include: {
        semesters: { orderBy: { number: 'asc' } }
      }
    });
    successResponse(res, branches, 'Branches');
  } catch (err) { next(err); }
});
