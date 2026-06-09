'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, Event } from '@/features/events/types';
import { createEventSchema } from '@/features/events/validations/create-event-schema';
import { getOrganizationId } from '@/lib/get-organization-id';
export async function createEvent(data: Record<string, unknown>): Promise<ActionResponse<Event>> {
  try {
    const parsed = createEventSchema.safeParse(data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { success: false, error: first?.message || 'Données invalides.' };
    }

    const validData = parsed.data;

    const organizationId = await getOrganizationId();

    let endDate = validData.endDate;
    if (endDate && validData.startDate) {
      const e = new Date(endDate);
      const s = new Date(validData.startDate);
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

    const eventData = {
      ...validData,
      organizationId,
      name: validData.name,
      type: validData.type,
      status: validData.status,
      startDate: validData.startDate,
      endDate,
      budget: validData.budget ? validData.budget : null,
    };

    const event = await prisma.event.create({
      data: eventData,
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

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}
