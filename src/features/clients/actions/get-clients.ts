'use server';

import { prisma } from "@/lib/prisma";
import type { ActionResponse, ClientWithStats, GetClientsParams, PaginatedClients } from "@/features/clients/types";
import { CLIENT_DEFAULT_PAGE_SIZE } from "@/features/clients/constants";
import { getOrganizationId } from "@/lib/get-organization-id";

export async function getClients(params: GetClientsParams): Promise<ActionResponse<PaginatedClients>> {
  try {
    const organizationId = await getOrganizationId();
    const { search, page = 1, limit = CLIENT_DEFAULT_PAGE_SIZE, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, clients] = await prisma.$transaction([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          totalSpent: true,
          lastOrderAt: true,
          createdAt: true,
          company: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    const clientIds = clients.map((c) => c.id);

    const [commandeCounts, eventCounts] = clientIds.length > 0
      ? await Promise.all([
          prisma.commande.groupBy({
            by: ['clientId'],
            where: { clientId: { in: clientIds } },
            _count: { id: true },
          }),
          prisma.event.groupBy({
            by: ['clientId'],
            where: { clientId: { in: clientIds } },
            _count: { id: true },
          }),
        ])
      : [[], []];

    const cmdCountMap = new Map(commandeCounts.map((r) => [r.clientId, r._count.id]));
    const evtCountMap = new Map(eventCounts.map((r) => [r.clientId, r._count.id]));

    const clientWithStats: ClientWithStats[] = clients.map((client) => ({
      id: client.id,
      organizationId: '',
      name: client.name,
      email: client.email,
      phone: client.phone,
      city: client.city,
      company: client.company,
      totalSpent: Number(client.totalSpent || 0),
      lastOrderAt: client.lastOrderAt,
      createdAt: client.createdAt,
      updatedAt: client.createdAt,
      commandesCount: cmdCountMap.get(client.id) ?? 0,
      eventsCount: evtCountMap.get(client.id) ?? 0,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: { data: clientWithStats, total, page, limit, totalPages },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred" };
  }
}
