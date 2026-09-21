import type { NotificationType } from '@prisma/client';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export const NOTIFICATION_LIST_LIMIT = 20;
