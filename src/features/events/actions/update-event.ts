'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { ActionResponse, Event, UpdateEventInput } from '@/features/events/types';

export async function updateEvent(data: UpdateEventInput): Promise<ActionResponse<Event>> {
  try {
    console.time('updateEvent:total');

    console.time('updateEvent:auth');
    const { userId } = await auth();
    console.timeEnd('updateEvent:auth');
    if (!userId) throw new Error('Unauthorized');

    console.time('updateEvent:orgLookup');
    const userOrg = await prisma.userOrganization.findFirst({
      where: { user: { clerkId: userId } },
      select: { organizationId: true }
    });
    console.timeEnd('updateEvent:orgLookup');
    if (!userOrg) throw new Error('Organization not found');

    const organizationId = userOrg.organizationId;
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