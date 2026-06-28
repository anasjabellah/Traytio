'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { ActionResponse, ClientWithStats } from '@/features/clients/types';
import { CLIENT_DEFAULT_PAGE_SIZE } from '@/features/clients/constants';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';

export type ClientStats = {
  totalClients: number;
  activeClients: number;
  totalRevenue: number;
  totalCommandes: number;
  newClients30d: number;
  averageValue: number;
  topCity: string;
  growthRate: number;
  topSpendingClient: { name: string; totalSpent: number } | null;
};

export type ActivityItem = {
  id: string;
  type: 'client_created' | 'client_updated' | 'commande_created' | 'event_assigned' | 'payment_received';
  description: string;
  clientName: string;
  clientId?: string;
  createdAt: Date;
};

export type ClientsPageResult = {
  clients: ClientWithStats[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: ClientStats;
  activity: ActivityItem[];
};

export type GetClientsPageParams = {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'totalSpent' | 'lastOrderAt';
  sortOrder?: 'asc' | 'desc';
};

export async function getClientsPage(params: GetClientsPageParams): Promise<ActionResponse<ClientsPageResult>> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('clients', 'read');

    const {
      search, page = 1, limit = CLIENT_DEFAULT_PAGE_SIZE,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const where: Prisma.ClientWhereInput = { organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const clientSelect = {
      id: true, name: true, email: true, phone: true, city: true,
      totalSpent: true, lastOrderAt: true, createdAt: true, company: true,
      _count: { select: { commandes: true, events: true } },
    } satisfies Prisma.ClientSelect;

    const [
      total, clients, totalRevenueResult, activeClientsCount,
      newClients30dCount, prevMonthClientsCount, topCityGroup,
      topSpendingClientResult, recentClientsForActivity, recentlyUpdatedClients,
      totalCommandes, recentCommandes, recentEvents, recentPayments,
    ] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        select: clientSelect,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.client.aggregate({ where, _sum: { totalSpent: true } }),
      prisma.client.count({ where: { ...where, lastOrderAt: { gte: ninetyDaysAgo } } }),
      prisma.client.count({ where: { ...where, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.client.count({ where: { ...where, createdAt: { gte: prevMonthStart, lt: thisMonthStart } } }),
      prisma.client.groupBy({
        by: ['city'],
        where: { ...where, city: { not: null } },
        _count: { city: true },
        orderBy: { _count: { city: 'desc' } },
        take: 1,
      }),
      prisma.client.findFirst({
        where,
        orderBy: { totalSpent: 'desc' },
        select: { name: true, totalSpent: true },
      }),
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, createdAt: true },
      }),
      prisma.client.findMany({
        where: { ...where, lastOrderAt: { not: null } },
        orderBy: { lastOrderAt: 'desc' },
        take: 5,
        select: { id: true, name: true, lastOrderAt: true, createdAt: true },
      }),
      prisma.commande.count({ where: { organizationId } }),
      prisma.commande.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, number: true, createdAt: true,
          client: { select: { id: true, name: true } },
        },
      }),
      prisma.event.findMany({
        where: { organizationId, clientId: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, name: true, createdAt: true,
          client: { select: { id: true, name: true } },
        },
      }),
      prisma.payment.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, amount: true, createdAt: true,
          invoice: {
            select: {
              commande: {
                select: {
                  client: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    // ── Map clients with stats ──
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
      commandesCount: client._count.commandes,
      eventsCount: client._count.events,
    }));

    // ── Compute stats (targeted queries, no all-clients scan) ──
    const totalClients = total;
    const totalRevenue = Number(totalRevenueResult._sum.totalSpent || 0);
    const averageValue = totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0;
    const growthRate = prevMonthClientsCount > 0
      ? Math.round(((newClients30dCount - prevMonthClientsCount) / prevMonthClientsCount) * 100)
      : newClients30dCount > 0 ? 100 : 0;
    const topCity = topCityGroup[0]?.city ?? '—';
    const topSpendingClient: { name: string; totalSpent: number } | null =
      topSpendingClientResult
        ? { name: topSpendingClientResult.name, totalSpent: Number(topSpendingClientResult.totalSpent) }
        : null;

    const stats: ClientStats = {
      totalClients,
      activeClients: activeClientsCount,
      totalRevenue,
      totalCommandes,
      newClients30d: newClients30dCount,
      averageValue,
      topCity,
      growthRate,
      topSpendingClient,
    };

    // ── Compute activity (only 5+5 recent clients, not full scan) ──
    const activities: ActivityItem[] = [];

    for (const c of recentClientsForActivity) {
      activities.push({
        id: `client-${c.id}`,
        type: 'client_created',
        description: 'Nouveau client créé',
        clientName: c.name,
        clientId: c.id,
        createdAt: c.createdAt,
      });
    }

    for (const c of recentlyUpdatedClients) {
      if (c.lastOrderAt && c.lastOrderAt.getTime() - c.createdAt.getTime() > 1000) {
        activities.push({
          id: `client-updated-${c.id}`,
          type: 'client_updated',
          description: 'Informations client mises à jour',
          clientName: c.name,
          clientId: c.id,
          createdAt: c.lastOrderAt,
        });
      }
    }

    for (const cmd of recentCommandes) {
      if (cmd.client) {
        activities.push({
          id: `commande-${cmd.id}`,
          type: 'commande_created',
          description: `Commande #${cmd.number} créée pour ce client`,
          clientName: cmd.client.name,
          clientId: cmd.client.id,
          createdAt: cmd.createdAt,
        });
      }
    }

    for (const ev of recentEvents) {
      if (ev.client) {
        activities.push({
          id: `event-${ev.id}`,
          type: 'event_assigned',
          description: 'Client associé à un événement',
          clientName: ev.client.name,
          clientId: ev.client.id,
          createdAt: ev.createdAt,
        });
      }
    }

    for (const pmt of recentPayments) {
      const client = pmt.invoice?.commande?.client;
      if (client) {
        activities.push({
          id: `payment-${pmt.id}`,
          type: 'payment_received',
          description: `Paiement de ${Number(pmt.amount).toLocaleString('fr-FR')} MAD reçu pour ce client`,
          clientName: client.name,
          clientId: client.id,
          createdAt: pmt.createdAt,
        });
      }
    }

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const activity = activities.slice(0, 10);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        clients: clientWithStats,
        total,
        page,
        limit,
        totalPages,
        stats,
        activity,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'An error occurred';
    return { success: false, error: msg };
  }
}
