'use server';

import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';

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

export async function getClientStats(): Promise<ClientStats> {
  const organizationId = await getOrganizationId();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [totalClients, newClients30d, aggregate, activeClients, topClient, totalCommandes] = await Promise.all([
    prisma.client.count({ where: { organizationId } }),
    prisma.client.count({ where: { organizationId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.client.aggregate({
      where: { organizationId },
      _sum: { totalSpent: true },
      _avg: { totalSpent: true },
    }),
    prisma.client.count({
      where: { organizationId, lastOrderAt: { gte: ninetyDaysAgo } },
    }),
    prisma.client.findFirst({
      where: { organizationId },
      orderBy: { totalSpent: 'desc' },
      select: { name: true, totalSpent: true },
    }),
    prisma.commande.count({ where: { organizationId } }),
  ]);

  const totalRevenue = Number(aggregate._sum.totalSpent || 0);
  const averageValue = Number(aggregate._avg.totalSpent || 0);

  const prevMonthClients = await prisma.client.count({
    where: {
      organizationId,
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lt: new Date(now.getFullYear(), now.getMonth(), 1),
      },
    },
  });

  const growthRate = prevMonthClients > 0
    ? Math.round(((newClients30d - prevMonthClients) / prevMonthClients) * 100)
    : newClients30d > 0 ? 100 : 0;

  const topCityAgg = await prisma.client.groupBy({
    by: ['city'],
    where: { organizationId, city: { not: null } },
    _count: { city: true },
    orderBy: { _count: { city: 'desc' } },
    take: 1,
  });

  const topCity = topCityAgg.length > 0 && topCityAgg[0].city ? topCityAgg[0].city : '—';

  const topSpendingClient = topClient
    ? { name: topClient.name, totalSpent: Number(topClient.totalSpent) }
    : null;

  return { totalClients, activeClients, totalRevenue, totalCommandes, newClients30d, averageValue, topCity, growthRate, topSpendingClient };
}
