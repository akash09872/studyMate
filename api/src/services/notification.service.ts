import { prisma } from '../prisma/client';
import { NotificationType } from '@prisma/client';

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
  data?: any
) => {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, link, data },
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

export const createBulkNotifications = async (
  userIds: string[],
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) => {
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type, title, body, link })),
    });
  } catch (err) {
    console.error('Failed to create bulk notifications:', err);
  }
};
