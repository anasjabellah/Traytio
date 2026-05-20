'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import type { ActionResponse, Client, ClientWithStats, GetClientsParams, PaginatedClients } from "@/features/clients/types";
import { CLIENT_DEFAULT_PAGE_SIZE } from "@/features/clients/constants";

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

export async function getClients(params: GetClientsParams): Promise<ActionResponse<PaginatedClients>> {
  try {
    const organizationId = await getOrganizationId();
    const { search, page = 1, limit = CLIENT_DEFAULT_PAGE_SIZE, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizationId
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const total = await prisma.client.count({ where });

    // Get clients with stats
    const clients = await prisma.client.findMany({
      where,
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
        _count: {
          select: {
            commandes: true,
            events: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    });

    // Transform to ClientWithStats
    const clientWithStats: ClientWithStats[] = clients.map((client: any) => ({
      ...client,
      commandesCount: client._count.commandes,
      eventsCount: client._count.events
    }));

    const totalPages = Math.ceil(total / limit);

    const result: PaginatedClients = {
      data: clientWithStats,
      total,
      page,
      limit,
      totalPages
    };

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred" };
  }
}