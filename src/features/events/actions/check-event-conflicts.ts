'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { EVENT } from '@/lib/notify/messages';
import { normalizeActionError } from '@/lib/action-error';

const checkEventConflictsSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  excludeEventId: z.string().optional(),
});

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

async function checkEventConflictsHandler(
  startDate: Date,
  endDate: Date | null,
  excludeEventId?: string
): Promise<{ success: boolean; data?: ConflictCheckResult; error?: string }> {
  try {
    const parsed = checkEventConflictsSchema.safeParse({ startDate, endDate, excludeEventId });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? EVENT.CONFLICT_CHECK_ERROR };
    }

    const { startDate: newStart, endDate: newEndParsed, excludeEventId: excludeId } = parsed.data;
    const newEnd = newEndParsed ? new Date(newEndParsed) : null;
    const orgId = await getOrganizationId();
    await assertCan('events', 'read');

    const dayStart = new Date(newStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(newStart);
    dayEnd.setHours(23, 59, 59, 999);

    const excludeParam = excludeId ?? null;

    const rows = await prisma.$queryRaw<EventRow[]>`
      SELECT
        id,
        name,
        "startDate",
        "endDate",
        "startDate" < ${newEnd ?? FAR_FUTURE} AND ("endDate" IS NULL OR "endDate" > ${newStart}) AS is_conflicting
      FROM "events"
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
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, EVENT.CONFLICT_CHECK_ERROR) };
  }
}

export const checkEventConflicts = withActionGuard(checkEventConflictsHandler, { name: 'events:read' })
