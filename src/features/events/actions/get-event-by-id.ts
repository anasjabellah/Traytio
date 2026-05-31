'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { ActionResponse, Event } from '@/features/events/types';

async function getOrganizationId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const userOrg = await prisma.userOrganization.findFirst({
    where: { user: { clerkId: userId } },
    select: { organizationId: true }
  });

  if (!userOrg) throw new Error('Organization not found');
  return userOrg.organizationId;
}

export async function getEventById(id: string): Promise<ActionResponse<Event>> {
  try {
    const organizationId = await getOrganizationId();

    const event = await prisma.event.findUnique({
      where: { id, organizationId }
    });

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

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}