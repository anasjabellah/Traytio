'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';
import { COMMON } from '@/lib/notify/messages';

const getMonthEventsSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
})

export type CalendarEventData = {
  id: string;
  name: string;
  status: string;
  startDate: Date;
  budget: number | null;
  clientName: string | null;
};

async function getMonthEventsHandler(
  year: number,
  month: number,
): Promise<{ success: boolean; data?: CalendarEventData[]; error?: string }> {
  try {
    getMonthEventsSchema.parse({ year, month });
    const organizationId = await getOrganizationId();
    await assertCan('events', 'read');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const events = await prisma.event.findMany({
      where: {
        organizationId,
        startDate: { gte: startDate, lt: endDate },
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        budget: true,
        client: { select: { name: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    const data: CalendarEventData[] = events.map((e) => ({
      id: e.id,
      name: e.name,
      status: e.status,
      startDate: e.startDate,
      budget: Number(e.budget) || null,
      clientName: e.client?.name ?? null,
    }));

    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, COMMON.UNEXPECTED_ERROR) };
  }
}

export const getMonthEvents = withActionGuard(getMonthEventsHandler, { name: 'events:read' })
