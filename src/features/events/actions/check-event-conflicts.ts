'use server';

import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';

let _checkConflictsCalls = 0;

export type ConflictEventInfo = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
};

export type ConflictCheckResult = {
  hasConflict: boolean;
  sameDayCount: number;
  conflictingEvents: ConflictEventInfo[];
  sameDayEvents: ConflictEventInfo[];
};

export async function checkEventConflicts(
  startDate: Date,
  endDate: Date | null,
  excludeEventId?: string
): Promise<{ success: boolean; data?: ConflictCheckResult; error?: string }> {
  try {
    _checkConflictsCalls++;
    if (_checkConflictsCalls % 20 === 0) console.warn(`[CALL_TRACE] checkEventConflicts called ${_checkConflictsCalls} times`);

    console.time('checkEventConflicts:total');

    const orgId = await getOrganizationId();

    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(startDate);
    dayEnd.setHours(23, 59, 59, 999);

    console.time('checkEventConflicts:findMany');
    const eventsOnDay = await prisma.event.findMany({
      where: {
        organizationId: orgId,
        id: excludeEventId ? { not: excludeEventId } : undefined,
        startDate: { lte: dayEnd },
        endDate: { gte: dayStart },
      },
      select: { id: true, name: true, startDate: true, endDate: true },
    });
    console.timeEnd('checkEventConflicts:findMany');

    const newStart = new Date(startDate);
    const newEnd = endDate ? new Date(endDate) : null;

    const conflicting: ConflictEventInfo[] = [];
    const nonConflicting: ConflictEventInfo[] = [];

    for (const ev of eventsOnDay) {
      const evStart = new Date(ev.startDate);
      const evEnd = ev.endDate ? new Date(ev.endDate) : null;

      const overlaps =
        evStart < (newEnd ?? new Date(8640000000000000)) &&
        (evEnd === null || evEnd > newStart);

      if (overlaps) {
        conflicting.push({ id: ev.id, name: ev.name, startDate: evStart, endDate: evEnd });
      } else {
        nonConflicting.push({ id: ev.id, name: ev.name, startDate: evStart, endDate: evEnd });
      }
    }

    console.timeEnd('checkEventConflicts:total');
    return {
      success: true,
      data: {
        hasConflict: conflicting.length > 0,
        sameDayCount: eventsOnDay.length,
        conflictingEvents: conflicting,
        sameDayEvents: nonConflicting,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to check conflicts' };
  }
}
