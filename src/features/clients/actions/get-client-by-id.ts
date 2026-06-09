'use server';

import { prisma } from "@/lib/prisma";
import type { ActionResponse, ClientWithStats } from "@/features/clients/types";
import { getOrganizationId } from "@/lib/get-organization-id";

export async function getClientById(id: string): Promise<ActionResponse<ClientWithStats>> {
  try {
    const organizationId = await getOrganizationId();

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
      return { success: false, error: "Client not found" };
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
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred" };
  }
}
