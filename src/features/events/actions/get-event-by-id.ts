'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, EventDetail } from '@/features/events/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { startTimer, endTimer } from '@/lib/log-timer';

let _getEventByIdCalls = 0;

export async function getEventById(id: string): Promise<ActionResponse<EventDetail>> {
  try {
    _getEventByIdCalls++;
    if (_getEventByIdCalls % 20 === 0) console.warn(`[CALL_TRACE] getEventById called ${_getEventByIdCalls} times`);

    const totalTimer = startTimer('getEventById:total');
    const organizationId = await getOrganizationId();

    const queryTimer = startTimer('getEventById:findUnique');
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
    endTimer(queryTimer);

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

    endTimer(totalTimer);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}