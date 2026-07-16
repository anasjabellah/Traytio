'use server';

import { z } from 'zod';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import type { ActionResponse, EventDetail } from '@/features/events/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { EVENT } from '@/lib/notify/messages';
import { normalizeActionError } from '@/lib/action-error';

const getEventByIdSchema = z.object({
  id: z.string().min(1),
});

async function getEventByIdHandler(id: string): Promise<ActionResponse<EventDetail>> {
  try {
    getEventByIdSchema.parse({ id });
    const organizationId = await getOrganizationId();
    await assertCan('events', 'read');

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

    if (!eventData) {
      return { success: false, error: EVENT.NOT_FOUND };
    }

    const [clientData, commandes] = await Promise.all([
      eventData.clientId
        ? prisma.client.findFirst({
            where: { id: eventData.clientId, organizationId },
            select: { id: true, name: true, email: true, phone: true },
          })
        : Promise.resolve(null),
      prisma.commande.findMany({
        where: { eventId: id, organizationId },
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

    return { success: true, data: result };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, EVENT.UNEXPECTED_ERROR) };
  }
}

export const getEventById = withActionGuard(cache(getEventByIdHandler), { name: 'events:read' })
