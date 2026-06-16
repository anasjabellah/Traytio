'use server';

import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';

export type CommandeStats = {
  currentMonth: {
    total: number;
    active: number;
    upcomingCount: number;
    revenue: number;
    remaining: number;
    conversionRate: number;
  };
  previousMonth: {
    total: number;
    active: number;
    upcomingCount: number;
    revenue: number;
    remaining: number;
    conversionRate: number;
  };
  sparklines: {
    revenue: number[];
    total: number[];
  };
};

export async function getCommandeStats(): Promise<CommandeStats> {
  const organizationId = await getOrganizationId();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const whereOrg = { organizationId };

  const [
    currentTotal,
    prevTotal,
    currentAll,
    prevAll,
    currentRevenueAgg,
    prevRevenueAgg,
    sparkRows,
  ] = await Promise.all([
    prisma.commande.count({ where: { ...whereOrg, createdAt: { gte: monthStart } } }),
    prisma.commande.count({ where: { ...whereOrg, createdAt: { gte: prevMonthStart, lt: monthStart } } }),
    prisma.commande.findMany({
      where: { ...whereOrg, createdAt: { gte: monthStart } },
      select: { status: true, totalAmount: true, remainingAmount: true, paidAmount: true, eventDate: true, createdAt: true },
    }),
    prisma.commande.findMany({
      where: { ...whereOrg, createdAt: { gte: prevMonthStart, lt: monthStart } },
      select: { status: true, totalAmount: true, remainingAmount: true, paidAmount: true, eventDate: true, createdAt: true },
    }),
    prisma.commande.aggregate({
      where: { ...whereOrg, createdAt: { gte: monthStart } },
      _sum: { totalAmount: true, remainingAmount: true },
    }),
    prisma.commande.aggregate({
      where: { ...whereOrg, createdAt: { gte: prevMonthStart, lt: monthStart } },
      _sum: { totalAmount: true, remainingAmount: true },
    }),
    prisma.commande.findMany({
      where: { ...whereOrg, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const calcStats = (rows: typeof currentAll) => {
    const total = rows.length;
    const active = rows.filter(r => r.status !== 'CANCELLED' && r.status !== 'DELIVERED' && r.status !== 'DRAFT').length;
    const upcomingCount = rows.filter(r => r.eventDate && new Date(r.eventDate) >= now && r.status !== 'CANCELLED').length;
    const revenue = rows.reduce((s, r) => s + Number(r.totalAmount), 0);
    const remaining = rows.reduce((s, r) => s + Number(r.remainingAmount), 0);
    const nonDraft = rows.filter(r => r.status !== 'DRAFT').length;
    const converted = rows.filter(r => r.status !== 'DRAFT' && r.status !== 'CANCELLED' && r.status !== 'QUOTED').length;
    const conversionRate = nonDraft > 0 ? Math.round((converted / nonDraft) * 100) : 0;
    return { total, active, upcomingCount, revenue, remaining, conversionRate };
  };

  const buildSparkline = (rows: typeof sparkRows): number[] => {
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const buckets = new Array(days).fill(0);
    for (const r of rows) {
      const d = new Date(r.createdAt).getDate();
      buckets[d - 1] += Number(r.totalAmount);
    }
    return buckets;
  };

  return {
    currentMonth: calcStats(currentAll),
    previousMonth: calcStats(prevAll),
    sparklines: {
      revenue: buildSparkline(sparkRows),
      total: [],
    },
  };
}
