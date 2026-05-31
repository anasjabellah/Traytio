'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { ActionResponse, Event, CreateEventInput } from '@/features/events/types';
import { createEventSchema } from '@/features/events/validations/create-event-schema';

export async function createEvent(data: CreateEventInput): Promise<ActionResponse<Event>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const userOrg = await prisma.userOrganization.findFirst({
      where: { user: { clerkId: userId } },
      select: { organizationId: true }
    });
    if (!userOrg) throw new Error('Organization not found');

    const organizationId = userOrg.organizationId;

    const eventData = {
      ...data,
      organizationId,
      budget: data.budget ? data.budget : null
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
        notes: true,
        createdAt: true,
        updatedAt: true
      }
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
      notes: event.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}