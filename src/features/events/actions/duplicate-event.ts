'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse, Event } from '@/features/events/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { EVENT } from '@/lib/notify/messages';
import { normalizeActionError } from '@/lib/action-error';

const duplicateEventSchema = z.object({
  id: z.string().min(1),
});

async function duplicateEventHandler(id: string): Promise<ActionResponse<Event>> {
  try {
    const parsed = duplicateEventSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? EVENT.VALIDATION.INVALID_VALUE };
    }

    const organizationId = await getOrganizationId();
    await assertCan('events', 'create');

    const original = await prisma.event.findUnique({
      where: { id, organizationId },
    });

    if (!original) {
      return { success: false, error: EVENT.NOT_FOUND };
    }

    const event = await prisma.event.create({
      data: {
        organizationId,
        name: `${original.name} (copie)`,
        type: original.type,
        status: 'DRAFT',
        startDate: original.startDate,
        endDate: original.endDate,
        location: original.location,
        guestCount: original.guestCount,
        budget: original.budget,
        contactPerson: original.contactPerson,
        contactPhone: original.contactPhone,
        notes: original.notes,
        clientId: original.clientId,
      },
      select: {
        id: true, organizationId: true, clientId: true, name: true, type: true,
        status: true, startDate: true, endDate: true, location: true,
        guestCount: true, budget: true, contactPerson: true, contactPhone: true,
        notes: true, createdAt: true, updatedAt: true,
      },
    });

    const result: Event = {
      id: event.id, organizationId: event.organizationId, clientId: event.clientId,
      name: event.name, type: event.type, status: event.status,
      startDate: event.startDate, endDate: event.endDate, location: event.location,
      guestCount: event.guestCount, budget: Number(event.budget) || null,
      contactPerson: event.contactPerson, contactPhone: event.contactPhone,
      notes: event.notes, createdAt: event.createdAt, updatedAt: event.updatedAt,
    };

    revalidatePath('/dashboard/events');
    revalidatePath('/dashboard/calendar');

    return { success: true, data: result };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, EVENT.UNEXPECTED_ERROR) };
  }
}

export const duplicateEvent = withActionGuard(duplicateEventHandler, { name: 'events:create' })
