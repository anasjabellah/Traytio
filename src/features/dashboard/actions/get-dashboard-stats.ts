'use server';

import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import type { CommandeStatus } from '@prisma/client';
import type { DashboardData } from '@/features/dashboard/types';

const COMMANDE_ACTIVE_STATUSES: CommandeStatus[] = ['QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'READY'];
const COMMANDE_REVENUE_STATUSES = { notIn: ['CANCELLED'] as CommandeStatus[] };

export async function getDashboardData(): Promise<{
  success: boolean;
  data?: DashboardData;
  error?: string;
}> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('dashboard', 'view');
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const startOfMonth = new Date(currentYear, now.getMonth(), 1);
    const startOfNextMonth = new Date(currentYear, now.getMonth() + 1, 1);
    const startOfToday = new Date(currentYear, now.getMonth(), now.getDate());
    const endOfToday = new Date(currentYear, now.getMonth(), now.getDate() + 1);

    // Last 8 months for perf charts
    const last8Months: { key: string; start: Date }[] = [];
    for (let i = 7; i >= 0; i--) {
      const m = new Date(currentYear, now.getMonth() - i, 1);
      last8Months.push({ key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`, start: m });
    }
    const eightMonthsAgo = last8Months[0].start;

    const [
      revenueAgg,
      budgetAgg,
      clientCount,
      eventsThisMonthCount,
      activeCommandesCount,
      paymentsAgg,
      pendingAgg,
      recentCommandes,
      upcoming,
      todayEventsDb,
      commandesForChart,
      eventsForStats,
      topItemAgg,
      bestClient,
      recentActivities,
      eventCountsRaw,
      clientCountsRaw,
    ] = await Promise.all([
      prisma.commande.aggregate({
        where: { organizationId, status: COMMANDE_REVENUE_STATUSES },
        _sum: { totalAmount: true },
      }),
      prisma.event.aggregate({
        where: { organizationId },
        _sum: { budget: true },
      }),
      prisma.client.count({ where: { organizationId } }),
      prisma.event.count({
        where: { organizationId, startDate: { gte: startOfMonth, lt: startOfNextMonth } },
      }),
      prisma.commande.count({
        where: { organizationId, status: { in: COMMANDE_ACTIVE_STATUSES } },
      }),
      prisma.commande.aggregate({
        where: { organizationId, status: COMMANDE_REVENUE_STATUSES },
        _sum: { paidAmount: true },
      }),
      prisma.commande.aggregate({
        where: { organizationId, remainingAmount: { gt: 0 }, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
        _sum: { remainingAmount: true },
      }),
      prisma.commande.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, number: true, createdAt: true, totalAmount: true, status: true,
          client: { select: { name: true } },
        },
      }),
      prisma.event.findMany({
        where: { organizationId, startDate: { gt: now } },
        orderBy: { startDate: 'asc' },
        take: 3,
        select: {
          id: true, name: true, startDate: true, guestCount: true, status: true,
          client: { select: { name: true } },
        },
      }),
      prisma.event.findMany({
        where: { organizationId, startDate: { gte: startOfToday, lt: endOfToday } },
        orderBy: { startDate: 'asc' },
        select: { id: true, name: true, startDate: true, guestCount: true },
      }),
      prisma.commande.findMany({
        where: { organizationId, status: COMMANDE_REVENUE_STATUSES, createdAt: { gte: startOfYear } },
        select: { totalAmount: true, createdAt: true, paidAmount: true },
      }),
      prisma.event.findMany({
        where: { organizationId, createdAt: { gte: startOfYear } },
        select: { budget: true, guestCount: true, status: true, createdAt: true },
      }),
      prisma.commandeItem.groupBy({
        by: ['name'],
        where: { commande: { organizationId } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 1,
      }),
      prisma.client.findFirst({
        where: { organizationId },
        orderBy: { totalSpent: 'desc' },
        select: { name: true, totalSpent: true },
      }),
      prisma.commandeActivity.findMany({
        where: { commande: { organizationId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, action: true, description: true, createdAt: true },
      }),
      prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
        SELECT
          DATE_TRUNC('month', "createdAt") AS month,
          COUNT(*)::int AS count
        FROM "events"
        WHERE "organizationId" = ${organizationId}
          AND "createdAt" >= ${eightMonthsAgo}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
        SELECT
          DATE_TRUNC('month', "createdAt") AS month,
          COUNT(*)::int AS count
        FROM "clients"
        WHERE "organizationId" = ${organizationId}
          AND "createdAt" >= ${eightMonthsAgo}
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

    // Revenue chart: monthly aggregation
    const monthlyMap: Record<string, number> = {};
    const paidMonthlyMap: Record<string, number> = {};
    for (const cmd of commandesForChart) {
      const d = new Date(cmd.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + Number(cmd.totalAmount);
      paidMonthlyMap[monthKey] = (paidMonthlyMap[monthKey] || 0) + Number(cmd.paidAmount);
    }

    // Activity feed
    const activity: DashboardData['activity'] = [];
    for (const a of recentActivities) {
      activity.push({
        who: 'Système',
        action: a.action,
        target: a.description || '',
        time: formatTimeAgo(new Date(a.createdAt)),
        financial: false,
      });
    }

    // Fallback: generate activity from recent commandes if activity table is empty
    if (activity.length === 0) {
      for (const c of recentCommandes) {
        activity.push({
          who: 'Système',
          action: 'a créé la commande',
          target: c.number || c.id.slice(0, 8),
          time: formatTimeAgo(new Date(c.createdAt)),
          financial: false,
        });
      }
    }

    // Business health
    const paidCommandes = commandesForChart.filter((c) => c.totalAmount);
    const avgEventValue =
      paidCommandes.length > 0
        ? Math.round(paidCommandes.reduce((s, c) => s + Number(c.totalAmount), 0) / paidCommandes.length)
        : 0;
    const totalAcompte = commandesForChart.reduce((s, c) => s + Number(c.paidAmount), 0);
    const avgDeposit =
      paidCommandes.length > 0 ? Math.round(totalAcompte / paidCommandes.length) : 0;

    const topMenuItem = topItemAgg.length > 0 ? topItemAgg[0].name : null;
    const topMenuCount = topItemAgg.length > 0 ? topItemAgg[0]._sum.quantity : null;

    // Monthly growth
    const thisMonthRevenue = commandesForChart
      .filter((c) => new Date(c.createdAt) >= startOfMonth)
      .reduce((s, c) => s + Number(c.totalAmount), 0);
    const lastMonthStart = new Date(currentYear, now.getMonth() - 1, 1);
    const lastMonthRevenue = commandesForChart
      .filter((c) => {
        const d = new Date(c.createdAt);
        return d >= lastMonthStart && d < startOfMonth;
      })
      .reduce((s, c) => s + Number(c.totalAmount), 0);
    const monthlyGrowth =
      lastMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 0;

    // Quick stats (from eventsForStats which is now limited to current year)
    const totalEvents = eventsForStats.length;
    const eventsWithBudget = eventsForStats.filter((e) => e.budget);
    const avgBudget =
      eventsWithBudget.length > 0
        ? Math.round(eventsWithBudget.reduce((s, e) => s + Number(e.budget), 0) / eventsWithBudget.length)
        : 0;
    const eventsWithGuests = eventsForStats.filter((e) => e.guestCount);
    const avgGuests =
      eventsWithGuests.length > 0
        ? Math.round(eventsWithGuests.reduce((s, e) => s + (e.guestCount || 0), 0) / eventsWithGuests.length)
        : 0;
    const completedEvents = eventsForStats.filter((e) => e.status === 'COMPLETED').length;
    const completionRate = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

    // Performance charts (last 8 months)
    const perfRevenue = last8Months.map(({ key }) => Math.round(monthlyMap[key] || 0));
    const perfPayments = last8Months.map(({ key }) => Math.round(paidMonthlyMap[key] || 0));

    const eventCountMap = new Map<string, number>();
    for (const row of (eventCountsRaw as Array<{ month: Date; count: bigint }>)) {
      const d = new Date(row.month);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      eventCountMap.set(key, Number(row.count));
    }

    const clientCountMap = new Map<string, number>();
    for (const row of (clientCountsRaw as Array<{ month: Date; count: bigint }>)) {
      const d = new Date(row.month);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      clientCountMap.set(key, Number(row.count));
    }
    const clientCountsPerMonth = last8Months.map(({ key }) => clientCountMap.get(key) ?? 0);

    return {
      success: true,
      data: {
        revenue: Math.round(Number(revenueAgg._sum?.totalAmount || 0)),
        totalBudget: Math.round(Number(budgetAgg._sum.budget || 0)),
        activeClients: clientCount,
        eventsThisMonth: eventsThisMonthCount,
        activeCommandes: activeCommandesCount,
        paymentsReceived: Math.round(Number(paymentsAgg._sum?.paidAmount || 0)),
        pendingDeposits: Math.round(Number(pendingAgg._sum.remainingAmount || 0)),
        recentCommandes: recentCommandes.map((c) => ({
          id: c.id,
          number: c.number || c.id.slice(0, 8),
          clientName: c.client?.name || 'Client',
          date: c.createdAt,
          total: Number(c.totalAmount),
          status: c.status,
        })),
        upcomingEvents: upcoming.map((e) => ({
          id: e.id,
          name: e.name,
          clientName: e.client?.name || null,
          startDate: e.startDate,
          guestCount: e.guestCount,
          status: e.status,
        })),
        todayEvents: todayEventsDb.map((e) => ({
          id: e.id,
          name: e.name,
          startDate: e.startDate,
          guestCount: e.guestCount,
        })),
        activity,
        health: {
          avgEventValue,
          avgDeposit,
          topMenuItem,
          topMenuCount,
          bestClientName: bestClient?.name || null,
          bestClientTotal: bestClient ? Math.round(Number(bestClient.totalSpent)) : null,
          monthlyGrowth,
        },
        quickStats: { avgBudget, avgGuests, completionRate },
        perfRevenue,
        perfEvents: last8Months.map(({ key }) => eventCountMap.get(key) ?? 0),
        perfClients: clientCountsPerMonth,
        perfPayments,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  return `il y a ${days} jours`;
}
