import { prisma } from '../prisma/client';
import { createNotification } from './notification.service';

const POINT_VALUES: Record<string, number> = {
  UPLOAD_APPROVED: 50,
  RATING_RECEIVED: 20,
  DOWNLOAD_MILESTONE: 30,
  HELPFUL_COMMENT: 5,
  FACULTY_PICK: 100,
  DAILY_LOGIN: 10,
  WEEKLY_CHALLENGE: 150,
  MONTHLY_CHALLENGE: 500,
  TOP_CONTRIBUTOR: 200,
  BADGE_BONUS: 25,
};

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500];
const LEVEL_NAMES = [
  'Newcomer', 'Contributor', 'Scholar', 'Expert', 'Specialist',
  'Mentor', 'Authority', 'Master', 'Grandmaster', 'Legend', 'Elite'
];

export const awardPoints = async (
  userId: string,
  eventType: string,
  description: string,
  resourceId?: string
) => {
  const points = POINT_VALUES[eventType] || 0;
  if (points === 0) return;

  const [transaction, user] = await Promise.all([
    prisma.pointTransaction.create({
      data: { userId, eventType: eventType as any, points, description, resourceId },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: points },
        contributionScore: { increment: points },
      },
      select: { totalPoints: true, level: true, firstName: true },
    }),
  ]);

  // Check for level up
  const newLevel = calculateLevel(user.totalPoints + points);
  if (newLevel > user.level) {
    await prisma.user.update({ where: { id: userId }, data: { level: newLevel } });
    await createNotification(
      userId,
      'BADGE_EARNED',
      `🎉 Level Up! You're now ${LEVEL_NAMES[newLevel]}`,
      `You reached Level ${newLevel}! Keep contributing to unlock more rewards.`,
      '/profile'
    );
  }

  // Check for auto badges
  await checkAndAwardBadges(userId, eventType);
};

const calculateLevel = (points: number): number => {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  return level;
};

export const checkAndAwardBadges = async (userId: string, eventType?: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      totalPoints: true,
      _count: { select: { resources: true, badges: true } },
    },
  });
  if (!user) return;

  const badges = await prisma.badge.findMany({ where: { isActive: true } });
  const earnedBadgeIds = (await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  })).map((b) => b.badgeId);

  for (const badge of badges) {
    if (earnedBadgeIds.includes(badge.id)) continue;

    const criteria = badge.criteria as any;
    let earned = false;

    if (criteria.type === 'UPLOAD_COUNT' && user._count.resources >= criteria.value) earned = true;
    if (criteria.type === 'POINT_COUNT' && user.totalPoints >= criteria.value) earned = true;

    if (earned) {
      await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
      await createNotification(
        userId,
        'BADGE_EARNED',
        `🏆 Badge Earned: ${badge.name}`,
        badge.description,
        '/profile'
      );
      await awardPoints(userId, 'BADGE_BONUS', `Bonus XP for earning "${badge.name}" badge`);
    }
  }
};
