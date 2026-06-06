'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, Event, UpdateEventInput } from '@/features/events/types';
import { getOrganizationId } from '@/lib/get-organization-id';

let _updateEventCalls = 0;

export async function updateEvent(data: UpdateEventInput): Promise<ActionResponse<Event>> {
  try {
    _updateEventCalls++;
    if (_updateEventCalls % 20 === 0) console.warn(`[CALL_TRACE] updateEvent called ${_updateEventCalls} times`);

    console.time('updateEvent:total');

    const organizationId = await getOrganizationId();
    const { id, ...updateData } = data;

    console.time('updateEvent:update');
    const event = await prisma.event.update({
      where: { id, organizationId },
      data: {
        ...updateData,
        budget: updateData.budget !== undefined ? updateData.budget : undefined
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
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    });
    console.timeEnd('updateEvent:update');

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
      notes: event.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };

    console.timeEnd('updateEvent:total');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}