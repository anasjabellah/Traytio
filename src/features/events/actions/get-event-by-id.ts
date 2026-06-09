'use server';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import type { ActionResponse, EventDetail } from '@/features/events/types';
import { getOrganizationId } from '@/lib/get-organization-id';

export const getEventById = cache(async (id: string): Promise<ActionResponse<EventDetail>> => {
  try {
    console.time('[PERF] getEventById total');

    console.time('[PERF] getOrganizationId');
    const organizationId = await getOrganizationId();
    console.timeEnd('[PERF] getOrganizationId');

    console.time('[PERF] eventQuery');
    const eventData = await prisma.event.findUnique({
      where: { id, organizationId },
      select: {
        id: true,
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
        clientId: true,
      },
    });
    console.timeEnd('[PERF] eventQuery');

    if (!eventData) {
      console.timeEnd('[PERF] getEventById total');
      return { success: false, error: 'Event not found' };
    }

    console.time('[PERF] clientQuery');
    const [clientData, commandes] = await Promise.all([
      eventData.clientId
        ? prisma.client.findUnique({
            where: { id: eventData.clientId },
            select: { id: true, name: true, email: true, phone: true },
          })
        : Promise.resolve(null),
      prisma.commande.findMany({
        where: { eventId: id },
        select: {
          id: true,
          number: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);
    console.timeEnd('[PERF] clientQuery');

    console.time('[PERF] dataProcessing');
    const result: EventDetail = {
      id: eventData.id,
      organizationId,
      clientId: eventData.clientId,
      name: eventData.name,
      type: eventData.type,
      status: eventData.status,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      location: eventData.location,
      guestCount: eventData.guestCount,
      budget: Number(eventData.budget) || null,
      contactPerson: eventData.contactPerson,
      contactPhone: eventData.contactPhone,
      notes: eventData.notes,
      createdAt: eventData.createdAt,
      updatedAt: eventData.updatedAt,
      client: clientData ?? undefined,
      commandes: commandes?.map((c) => ({
        ...c,
        totalAmount: Number(c.totalAmount),
      })) ?? undefined,
    };
    console.timeEnd('[PERF] dataProcessing');

    console.timeEnd('[PERF] getEventById total');
    return { success: true, data: result };
  } catch (error: any) {
    console.timeEnd('[PERF] getEventById total');
    return { success: false, error: error.message || 'An error occurred' };
  }
});
