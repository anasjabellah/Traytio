'use server';

import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
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

const FAR_FUTURE = new Date(8640000000000000);

function toConflictInfo(ev: { id: string; name: string; startDate: Date; endDate: Date | null }): ConflictEventInfo {
  return { id: ev.id, name: ev.name, startDate: new Date(ev.startDate), endDate: ev.endDate ? new Date(ev.endDate) : null };
}

type EventRow = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  is_conflicting: boolean;
};

export async function checkEventConflicts(
  startDate: Date,
  endDate: Date | null,
  excludeEventId?: string
): Promise<{ success: boolean; data?: ConflictCheckResult; error?: string }> {
  try {
    const orgId = await getOrganizationId();

    const newStart = new Date(startDate);
    const newEnd = endDate ? new Date(endDate) : null;

    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(startDate);
    dayEnd.setHours(23, 59, 59, 999);

    const excludeParam = excludeEventId ?? null;

    const rows = await prisma.$queryRaw<EventRow[]>`
      SELECT
        id,
        name,
        "startDate",
        "endDate",
        "startDate" < ${newEnd ?? FAR_FUTURE} AND ("endDate" IS NULL OR "endDate" > ${newStart}) AS is_conflicting
      FROM events
      WHERE "organizationId" = ${orgId}
        AND (${excludeParam}::text IS NULL OR id != ${excludeParam}::text)
        AND "startDate" <= ${dayEnd}
        AND "endDate" >= ${dayStart}
      ORDER BY "startDate"
    `;

    const conflicting: ConflictEventInfo[] = [];
    const sameDay: ConflictEventInfo[] = [];

    for (const row of rows) {
      const info = toConflictInfo(row);
      if (row.is_conflicting) {
        conflicting.push(info);
      } else {
        sameDay.push(info);
      }
    }

    return {
      success: true,
      data: {
        hasConflict: conflicting.length > 0,
        sameDayCount: rows.length,
        conflictingEvents: conflicting,
        sameDayEvents: sameDay,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to check conflicts' };
  }
}
