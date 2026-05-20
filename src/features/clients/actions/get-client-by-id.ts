'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import type { ActionResponse, Client, ClientWithStats } from "@/features/clients/types";

async function getOrganizationId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const userOrg = await prisma.userOrganization.findFirst({
    where: { user: { clerkId: userId } },
    select: { organizationId: true }
  })

  if (!userOrg) throw new Error("Organization not found")
  return userOrg.organizationId
}

export async function getClientById(id: string): Promise<ActionResponse<ClientWithStats>> {
  try {
    const organizationId = await getOrganizationId();

    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId
      },
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
          orderBy: {
            createdAt: 'desc'
          },
          take: 5,
          select: {
            id: true,
            number: true,
            status: true,
            totalAmount: true,
            createdAt: true
          }
        },
        events: {
          orderBy: {
            startDate: 'desc'
          },
          take: 5,
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true
          }
        },
        _count: {
          select: {
            commandes: true,
            events: true
          }
        }
      }
    });

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    const { _count, totalSpent, ...rest } = client;
      const clientWithStats = {
        ...rest,
        totalSpent: Number(totalSpent),
        commandesCount: _count.commandes,
        eventsCount: _count.events,
      } as unknown as import("@/features/clients/types").ClientWithStats;

    return { success: true, data: clientWithStats };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred" };
  }
}