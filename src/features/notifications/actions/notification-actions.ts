'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentMembership, assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { NOTIFICATION } from '@/lib/notify/messages';
import { normalizeActionError } from '@/lib/action-error';
import {
  NOTIFICATION_LIST_LIMIT,
  type ActionResponse,
  type NotificationItem,
} from '@/features/notifications/types';

function serialize(row: {
  id: string;
  type: NotificationItem['type'];
  title: string;
  message: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
}): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    href: row.href,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function getNotificationsHandler(): Promise<ActionResponse<NotificationItem[]>> {
  try {
    const membership = await getCurrentMembership();
    await assertCan('notifications', 'read');

    const rows = await prisma.notification.findMany({
      where: { organizationId: membership.organizationId, userId: membership.userId },
      orderBy: { createdAt: 'desc' },
      take: NOTIFICATION_LIST_LIMIT,
      select: {
        id: true, type: true, title: true, message: true,
        href: true, readAt: true, createdAt: true,
      },
    });

    return { success: true, data: rows.map(serialize) };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, NOTIFICATION.FETCH_ERROR) };
  }
}

async function getUnreadNotificationCountHandler(): Promise<ActionResponse<number>> {
  try {
    const membership = await getCurrentMembership();
    await assertCan('notifications', 'read');

    const count = await prisma.notification.count({
      where: {
        organizationId: membership.organizationId,
        userId: membership.userId,
        readAt: null,
      },
    });

    return { success: true, data: count };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, NOTIFICATION.FETCH_ERROR) };
  }
}

const markNotificationAsReadSchema = z.object({
  id: z.string().min(1),
});

async function markNotificationAsReadHandler(id: string): Promise<ActionResponse<void>> {
  try {
    const parsed = markNotificationAsReadSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? NOTIFICATION.INVALID_INPUT };
    }

    const membership = await getCurrentMembership();
    await assertCan('notifications', 'update');

    // Ownership is enforced in the WHERE clause: a user can only ever touch
    // their own rows inside their own organization.
    const updated = await prisma.notification.updateMany({
      where: {
        id: parsed.data.id,
        organizationId: membership.organizationId,
        userId: membership.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    if (updated.count === 0) {
      return { success: false, error: NOTIFICATION.NOT_FOUND };
    }

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, NOTIFICATION.MARK_READ_ERROR) };
  }
}

async function markAllNotificationsAsReadHandler(): Promise<ActionResponse<{ marked: number }>> {
  try {
    const membership = await getCurrentMembership();
    await assertCan('notifications', 'update');

    const updated = await prisma.notification.updateMany({
      where: {
        organizationId: membership.organizationId,
        userId: membership.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { success: true, data: { marked: updated.count } };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, NOTIFICATION.MARK_ALL_READ_ERROR) };
  }
}

export const getNotifications = withActionGuard(getNotificationsHandler, { name: 'notifications:read' });
export const getUnreadNotificationCount = withActionGuard(getUnreadNotificationCountHandler, { name: 'notifications:read' });
export const markNotificationAsRead = withActionGuard(markNotificationAsReadHandler, { name: 'notifications:update' });
export const markAllNotificationsAsRead = withActionGuard(markAllNotificationsAsReadHandler, { name: 'notifications:update' });
