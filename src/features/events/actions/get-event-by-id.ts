'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, EventDetail } from '@/features/events/types';
import { getOrganizationId } from '@/lib/get-organization-id';

export async function getEventById(id: string): Promise<ActionResponse<EventDetail>> {
  try {
    const organizationId = await getOrganizationId();

    const event = await prisma.event.findUnique({
      where: { id, organizationId },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        commandes: {
          select: {
            id: true,
            number: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    const result: EventDetail = {
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
      client: event.client ?? undefined,
      commandes: event.commandes?.map((c) => ({
        ...c,
        totalAmount: Number(c.totalAmount),
      })) ?? undefined,
    };

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}
