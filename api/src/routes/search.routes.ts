import { Router } from 'express';
import { prisma } from '../prisma/client';
import { successResponse } from '../utils/response';

export const searchRouter = Router();

// GET /api/search?q=...&type=...&branchId=...&semesterId=...
searchRouter.get('/', async (req: any, res: any, next: any) => {
  try {
    const {
      q, type, branchId, semesterId, subjectId,
      sortBy = 'relevance', limit = 20, page = 1,
    } = req.query;

    if (!q || (q as string).trim().length < 2) {
      return successResponse(res, [], 'Provide at least 2 characters to search');
    }

    const searchTerm = (q as string).trim();
    const take = Math.min(50, parseInt(limit as string));
    const skip = (parseInt(page as string) - 1) * take;

    const where: any = {
      status: 'APPROVED',
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { author: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { some: { name: { contains: searchTerm, mode: 'insensitive' } } } },
        { subject: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ],
    };

    if (type) where.type = type;
    if (branchId) where.branchId = branchId;
    if (semesterId) where.semesterId = semesterId;
    if (subjectId) where.subjectId = subjectId;

    const orderBy: any =
      sortBy === 'downloads' ? { downloadCount: 'desc' }
      : sortBy === 'rating' ? { averageRating: 'desc' }
      : sortBy === 'newest' ? { createdAt: 'desc' }
      : { downloadCount: 'desc' }; // relevance fallback

    const [results, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          subject: { select: { name: true, code: true } },
          branch: { select: { shortName: true } },
          semester: { select: { number: true } },
          uploader: { select: { firstName: true, lastName: true, avatarUrl: true } },
          tags: { select: { name: true } },
        },
      }),
      prisma.resource.count({ where }),
    ]);

    successResponse(res, { results, total, query: searchTerm }, 'Search complete');
  } catch (err) {
    next(err);
  }
});

// GET /api/search/suggestions?q=...
searchRouter.get('/suggestions', async (req: any, res: any, next: any) => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) return successResponse(res, [], 'OK');

    const [resources, subjects, tags] = await Promise.all([
      prisma.resource.findMany({
        where: { status: 'APPROVED', title: { contains: q as string, mode: 'insensitive' } },
        select: { title: true },
        take: 5,
      }),
      prisma.subject.findMany({
        where: { name: { contains: q as string, mode: 'insensitive' } },
        select: { name: true },
        take: 3,
      }),
      prisma.resourceTag.findMany({
        where: { name: { contains: q as string, mode: 'insensitive' } },
        select: { name: true },
        distinct: ['name'],
        take: 3,
      }),
    ]);

    const suggestions = [
      ...resources.map((r) => ({ type: 'resource', text: r.title })),
      ...subjects.map((s) => ({ type: 'subject', text: s.name })),
      ...tags.map((t) => ({ type: 'tag', text: t.name })),
    ];

    successResponse(res, suggestions, 'Suggestions');
  } catch (err) {
    next(err);
  }
});
