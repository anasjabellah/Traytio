'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse, Event } from '@/features/events/types';
import { updateEventSchema } from '@/features/events/validations/update-event-schema';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { EVENT } from '@/lib/notify/messages';
import { normalizeActionError } from '@/lib/action-error';

async function updateEventHandler(data: Record<string, unknown>): Promise<ActionResponse<Event>> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('events', 'update');

    const parsed = updateEventSchema.safeParse(data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { success: false, error: first?.message || EVENT.INVALID_INPUT };
    }

    const { id, ...validData } = parsed.data;

    let endDate = validData.endDate ? new Date(validData.endDate as Date) : undefined;
    if (endDate && validData.startDate) {
      const s = new Date(validData.startDate as Date);
      const e = endDate;
      const sameDay = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate();
      if (sameDay) {
        const eh = e.getHours(), em = e.getMinutes();
        const sh = s.getHours(), sm = s.getMinutes();
        if (eh < sh || (eh === sh && em < sm)) {
          e.setDate(e.getDate() + 1);
          endDate = e;
        }
      }
    }

    const event = await prisma.event.update({
      where: { id, organizationId },
      data: {
        ...validData,
        startDate: validData.startDate ? new Date(validData.startDate as Date) : undefined,
        endDate: endDate ?? undefined,
        budget: validData.budget !== undefined ? validData.budget : undefined,
      },
      select: {
        id: true,
        organizationId: true,
        clientId: true,
        name: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        location: true,
        guestCount: true,
        budget: true,
        contactPerson: true,
        contactPhone: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ── Sync snapshot fields on linked commandes ──────────────────
    const snapshot: Record<string, unknown> = {};

    if ('type' in validData) snapshot.eventType = validData.type;
    if ('startDate' in validData) snapshot.eventDate = new Date(validData.startDate as Date);
    if ('guestCount' in validData) snapshot.guestCount = validData.guestCount;
    if ('location' in validData) snapshot.location = validData.location;
    if ('contactPerson' in validData) snapshot.contactName = validData.contactPerson;
    if ('contactPhone' in validData) snapshot.contactPhone = validData.contactPhone;
    if ('notes' in validData) snapshot.notes = validData.notes;
    if ('budget' in validData) snapshot.clientBudget = validData.budget;

    if (Object.keys(snapshot).length > 0) {
      await prisma.commande.updateMany({
        where: { eventId: id, organizationId },
        data: snapshot,
      });
    }

    const result: Event = {
      id: event.id,
      organizationId: event.organizationId,
      clientId: event.clientId,
      name: event.name,
      type: event.type,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      guestCount: event.guestCount,
      budget: Number(event.budget) || null,
      contactPerson: event.contactPerson,
      contactPhone: event.contactPhone,
      notes: event.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };

    revalidatePath("/dashboard/events")
    revalidatePath("/dashboard/commandes")
    revalidatePath("/dashboard/calendar")

    return { success: true, data: result };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, EVENT.UNEXPECTED_ERROR) };
  }
}

export const updateEvent = withActionGuard(updateEventHandler, { name: 'events:update' })
