'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, Event, CreateEventInput } from '@/features/events/types';
import { createEventSchema } from '@/features/events/validations/create-event-schema';
import { getOrganizationId } from '@/lib/get-organization-id';
import { startTimer, endTimer } from '@/lib/log-timer';

let _createEventCalls = 0;

export async function createEvent(data: CreateEventInput): Promise<ActionResponse<Event>> {
  try {
    _createEventCalls++;
    if (_createEventCalls % 20 === 0) console.warn(`[CALL_TRACE] createEvent called ${_createEventCalls} times`);

    const totalTimer = startTimer('createEvent:total');

    const organizationId = await getOrganizationId();

    const eventData = {
      ...data,
      organizationId,
      budget: data.budget ? data.budget : null
    };

    const createTimer = startTimer('createEvent:create');
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
        updatedAt: true
      }
    });
    endTimer(createTimer);

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
      updatedAt: event.updatedAt
    };

    endTimer(totalTimer);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}