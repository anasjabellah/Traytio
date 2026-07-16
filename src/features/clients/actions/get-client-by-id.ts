'use server';

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ActionResponse, ClientWithStats } from "@/features/clients/types";
import { getOrganizationId } from "@/lib/get-organization-id";
import { CLIENT } from "@/lib/notify/messages";
import { assertCan } from "@/lib/assert-role";
import { withActionGuard } from "@/lib/action-guard";
import { normalizeActionError } from "@/lib/action-error";

const getClientByIdSchema = z.object({
  id: z.string().min(1),
});

async function getClientByIdHandler(id: string): Promise<ActionResponse<ClientWithStats>> {
  try {
    getClientByIdSchema.parse({ id });
    const organizationId = await getOrganizationId();
    await assertCan('clients', 'read');

    const client = await prisma.client.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        organizationId: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        company: true,
        siret: true,
        notes: true,
        totalSpent: true,
        lastOrderAt: true,
        createdAt: true,
        updatedAt: true,
        commandes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, number: true, status: true, totalAmount: true, createdAt: true },
        },
        events: {
          orderBy: { startDate: 'desc' },
          take: 5,
          select: { id: true, name: true, type: true, status: true, startDate: true, endDate: true },
        },
      },
    });

    if (!client) {
      return { success: false, error: CLIENT.NOT_FOUND };
    }

    const { totalSpent, commandes, events, ...rest } = client;
    const clientWithStats: ClientWithStats = {
      ...rest,
      totalSpent: Number(totalSpent),
      commandesCount: commandes?.length ?? 0,
      eventsCount: events?.length ?? 0,
      commandes: commandes?.map((c) => ({
        ...c,
        totalAmount: Number(c.totalAmount),
      })) ?? undefined,
      events: events ?? undefined,
    };

    return { success: true, data: clientWithStats };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, CLIENT.UNEXPECTED_ERROR) };
  }
}

export const getClientById = withActionGuard(getClientByIdHandler, { name: 'clients:read' })
