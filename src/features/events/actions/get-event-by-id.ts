'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { ActionResponse, Event } from '@/features/events/types';

async function getOrganizationId(): Promise<string> {
  console.time('getEventById:auth');
  const { userId } = await auth();
  console.timeEnd('getEventById:auth');
  if (!userId) throw new Error('Unauthorized');

  console.time('getEventById:orgLookup');
  const userOrg = await prisma.userOrganization.findFirst({
    where: { user: { clerkId: userId } },
    select: { organizationId: true }
  });
  console.timeEnd('getEventById:orgLookup');

  if (!userOrg) throw new Error('Organization not found');
  return userOrg.organizationId;
}

export async function getEventById(id: string): Promise<ActionResponse<Event>> {
  try {
    console.time('getEventById:total');
    const organizationId = await getOrganizationId();

    console.time('getEventById:findUnique');
    const event = await prisma.event.findUnique({
      where: { id, organizationId }
    });
    console.timeEnd('getEventById:findUnique');

    if (!event) {
      return { success: false, error: 'Event not found' };
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
      notes: event.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };

    console.timeEnd('getEventById:total');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}