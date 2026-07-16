'use server';

import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import type { ActivityFeedItem, ActivityFeedResponse, ActivityType, ActivityPagination } from '@/features/activity/types';

const ACTION_TO_TYPE: Record<string, ActivityType> = {
  commande_created: 'commande_created',
  commande_updated: 'commande_updated',
  commande_status: 'commande_status',
  payment_received: 'payment_received',
  client_created: 'client_created',
  event_created: 'event_created',
  invoice_created: 'invoice_created',
};

const ACTIVITY_DEFAULT_PAGE_SIZE = 20;

function fmtTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  return `il y a ${weeks} sem`;
}

async function getActivityHandler(params?: { page?: number; limit?: number }): Promise<{ success: boolean; data?: ActivityFeedResponse; error?: string }> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('dashboard', 'view');

    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.max(1, Math.min(100, params?.limit ?? ACTIVITY_DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * limit;

    const [total, activities] = await Promise.all([
      prisma.commandeActivity.count({
        where: { commande: { organizationId } },
      }),
      prisma.commandeActivity.findMany({
        where: { commande: { organizationId } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          commande: {
            select: { id: true, number: true },
          },
        },
      }),
    ]);

    const items: ActivityFeedItem[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today.getTime() - today.getDay() * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalToday = 0;
    let totalWeek = 0;
    let totalMonth = 0;

    for (const a of activities) {
      const type = ACTION_TO_TYPE[a.action] || 'commande_updated';
      const ts = new Date(a.createdAt);
      const label = a.commande?.number ? `#${a.commande.number}` : '';

      items.push({
        id: `act-${a.id}`,
        type,
        description: a.description + (label ? ` (${label})` : ''),
        timestamp: ts,
        timeAgo: fmtTimeAgo(ts),
        entityId: a.commande?.id || null,
        entityType: 'commande',
        entityLabel: label || null,
      });

      if (ts >= today) totalToday++;
      if (ts >= weekStart) totalWeek++;
      if (ts >= monthStart) totalMonth++;
    }

    const totalPages = Math.ceil(total / limit);
    const pagination: ActivityPagination = { page, limit, total, totalPages };

    return {
      success: true,
      data: { items, stats: { totalToday, totalWeek, totalMonth }, pagination },
    };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
}

export const getActivity = withActionGuard(getActivityHandler, { name: 'dashboard:view' })
