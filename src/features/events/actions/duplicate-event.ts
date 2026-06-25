'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse, Event } from '@/features/events/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';

export async function duplicateEvent(id: string): Promise<ActionResponse<Event>> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('events', 'create');

    const original = await prisma.event.findUnique({
      where: { id, organizationId },
    });

    if (!original) {
      return { success: false, error: 'Événement introuvable.' };
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
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}
