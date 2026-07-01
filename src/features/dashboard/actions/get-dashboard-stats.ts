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
    const startOfToday = new Date(currentYear, now.getMonth(), now.getDate());
    const endOfToday = new Date(currentYear, now.getMonth(), now.getDate() + 1);
    const twentyFourMonthsAgo = new Date(currentYear, now.getMonth() - 23, 1);

    // Last 8 months for perf charts
    const last8Months: { key: string; start: Date }[] = [];
    for (let i = 7; i >= 0; i--) {
      const m = new Date(currentYear, now.getMonth() - i, 1);
      last8Months.push({ key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`, start: m });
    }
    const eightMonthsAgo = last8Months[0].start;

    const [
      revenueAgg,
      allRevenueData,
      clientCount,
      activeCommandesCount,
      pendingAgg,
      recentCommandes,
      topItemAgg,
      bestClient,
      recentActivities,
      confirmedEventsCount,
      completedEventsCount,
      totalBudgetAgg,
      upcomingEvents,
      todayEvents,
      yearEvents,
      perfEventRows,
      clientCountsRaw,
    ] = await Promise.all([
      // All-time revenue/payments aggregate (lightweight, no row data)
      prisma.commande.aggregate({
        where: { organizationId, status: COMMANDE_REVENUE_STATUSES },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      // Extended fetch for chart analytics (24-month window)
      prisma.commande.findMany({
        where: { organizationId, status: COMMANDE_REVENUE_STATUSES, createdAt: { gte: twentyFourMonthsAgo } },
        select: { totalAmount: true, paidAmount: true, createdAt: true },
      }),
      prisma.client.count({ where: { organizationId } }),
      prisma.commande.count({
        where: { organizationId, status: { in: COMMANDE_ACTIVE_STATUSES } },
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
      // Confirmed events count (index-only)
      prisma.event.count({ where: { organizationId, status: 'CONFIRMED' } }),
      // Completed events count (index-only)
      prisma.event.count({ where: { organizationId, status: 'COMPLETED' } }),
      // Total budget aggregate (index-only)
      prisma.event.aggregate({
        where: { organizationId },
        _sum: { budget: true },
      }),
      // Upcoming 3 events (take:3, bounded)
      prisma.event.findMany({
        where: { organizationId, startDate: { gt: now } },
        orderBy: { startDate: 'asc' },
        take: 3,
        select: {
          id: true, name: true, startDate: true, guestCount: true, status: true,
          client: { select: { name: true } },
        },
      }),
      // Today's events (bounded date range)
      prisma.event.findMany({
        where: { organizationId, startDate: { gte: startOfToday, lt: endOfToday } },
        select: { id: true, name: true, startDate: true, guestCount: true },
      }),
      // Current-year events for quickStats (3 fields only, bounded)
      prisma.event.findMany({
        where: { organizationId, createdAt: { gte: startOfYear } },
        select: { status: true, budget: true, guestCount: true },
      }),
      // Event monthly counts for perf chart (last 8 months only, minimal fields)
      prisma.event.findMany({
        where: { organizationId, createdAt: { gte: eightMonthsAgo } },
        select: { createdAt: true },
      }),
      // Client growth (raw SQL required for date-trunc groupBy)
      prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
        SELECT DATE_TRUNC('month', "createdAt") AS month, COUNT(*)::int AS count
        FROM "clients"
        WHERE "organizationId" = ${organizationId} AND "createdAt" >= ${eightMonthsAgo}
        GROUP BY 1 ORDER BY 1
      `,
    ]);

    // ── Revenue maps (single pass over allRevenueData) ──
    const dailyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    const paidMonthlyMap = new Map<string, number>();

    for (const cmd of allRevenueData) {
      const d = new Date(cmd.createdAt);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const val = Number(cmd.totalAmount);
      const paid = Number(cmd.paidAmount);
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + val);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + val);
      paidMonthlyMap.set(monthKey, (paidMonthlyMap.get(monthKey) || 0) + paid);
    }

    // ── Totals from the all-time aggregate ──
    const totalRevenue = Math.round(Number(revenueAgg._sum?.totalAmount || 0));
    const paymentsReceived = Math.round(Number(revenueAgg._sum?.paidAmount || 0));

    // ── Revenue analytics (week pre-computed; month/year computed lazily on client) ──
    const weekData: number[] = [];
    const weekLabels: string[] = [];
    let weekCurrent = 0;
    let weekPrevious = 0;
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const val = dailyMap.get(dayKey) || 0;
      if (i >= 7) weekPrevious += val;
      else weekCurrent += val;
      if (i < 7) {
        weekData.push(Math.round(val));
        weekLabels.push(d.toLocaleDateString('fr-FR', { weekday: 'short' }));
      }
    }
    const weekGrowth = weekPrevious === 0 && weekCurrent === 0 ? 0
      : weekPrevious === 0 ? 100
      : Math.round(((weekCurrent - weekPrevious) / weekPrevious) * 100);

    const revenueMaps: DashboardData['revenueMaps'] = {
      daily: Object.fromEntries(dailyMap),
      monthly: Object.fromEntries(monthlyMap),
      paidMonthly: Object.fromEntries(paidMonthlyMap),
    };

    // ── Current-year subset for business health ──
    const yearRevenueData = allRevenueData.filter((c) => new Date(c.createdAt) >= startOfYear);

    // ── Activity feed ──
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

    // ── Business health ──
    const paidCommandes = yearRevenueData.filter((c) => c.totalAmount);
    const avgEventValue =
      paidCommandes.length > 0
        ? Math.round(paidCommandes.reduce((s, c) => s + Number(c.totalAmount), 0) / paidCommandes.length)
        : 0;
    const totalAcompte = yearRevenueData.reduce((s, c) => s + Number(c.paidAmount), 0);
    const avgDeposit =
      paidCommandes.length > 0 ? Math.round(totalAcompte / paidCommandes.length) : 0;
    const thisMonthRevenue = yearRevenueData
      .filter((c) => new Date(c.createdAt) >= startOfMonth)
      .reduce((s, c) => s + Number(c.totalAmount), 0);
    const lastMonthStart = new Date(currentYear, now.getMonth() - 1, 1);
    const lastMonthRevenue = yearRevenueData
      .filter((c) => {
        const d = new Date(c.createdAt);
        return d >= lastMonthStart && d < startOfMonth;
      })
      .reduce((s, c) => s + Number(c.totalAmount), 0);
    const monthlyGrowth =
      lastMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 0;

    const topMenuItem = topItemAgg.length > 0 ? topItemAgg[0].name : null;
    const topMenuCount = topItemAgg.length > 0 ? topItemAgg[0]._sum.quantity : null;

    // ── Quick stats (from yearEvents query: status, budget, guestCount) ──
    const totalQuickEvents = yearEvents.length;
    const eventsWithBudget = yearEvents.filter((e) => e.budget);
    const avgBudget =
      eventsWithBudget.length > 0
        ? Math.round(eventsWithBudget.reduce((s, e) => s + Number(e.budget), 0) / eventsWithBudget.length)
        : 0;
    const eventsWithGuests = yearEvents.filter((e) => e.guestCount);
    const avgGuests =
      eventsWithGuests.length > 0
        ? Math.round(eventsWithGuests.reduce((s, e) => s + (e.guestCount || 0), 0) / eventsWithGuests.length)
        : 0;
    const compEventsFiltered = yearEvents.filter((e) => e.status === 'COMPLETED').length;
    const completionRate = totalQuickEvents > 0 ? Math.round((compEventsFiltered / totalQuickEvents) * 100) : 0;

    // ── Performance charts ──
    const perfRevenue = last8Months.map(({ key }) => Math.round(monthlyMap.get(key) ?? 0));
    const perfPayments = last8Months.map(({ key }) => Math.round(paidMonthlyMap.get(key) ?? 0));

    const eventCountMap = new Map<string, number>();
    for (const e of perfEventRows) {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      eventCountMap.set(key, (eventCountMap.get(key) || 0) + 1);
    }

    const clientCountMap = new Map<string, number>();
    for (const row of (clientCountsRaw as Array<{ month: Date; count: bigint }>)) {
      const d = new Date(row.month);
      clientCountMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, Number(row.count));
    }
    const clientCountsPerMonth = last8Months.map(({ key }) => clientCountMap.get(key) ?? 0);

    return {
      success: true,
      data: {
        revenue: totalRevenue,
        totalBudget: Math.round(Number(totalBudgetAgg._sum?.budget || 0)),
        activeClients: clientCount,
        confirmedEvents: confirmedEventsCount,
        completedEvents: completedEventsCount,
        activeCommandes: activeCommandesCount,
        paymentsReceived,
        pendingDeposits: Math.round(Number(pendingAgg._sum.remainingAmount || 0)),
        recentCommandes: recentCommandes.map((c) => ({
          id: c.id,
          number: c.number || c.id.slice(0, 8),
          clientName: c.client?.name || 'Client',
          date: c.createdAt,
          total: Number(c.totalAmount),
          status: c.status,
        })),
        upcomingEvents: upcomingEvents.map((e) => ({
          id: e.id,
          name: e.name,
          clientName: e.client?.name || null,
          startDate: e.startDate,
          guestCount: e.guestCount,
          status: e.status,
        })),
        todayEvents: todayEvents.map((e) => ({
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
        revenueMaps,
        weekAnalytics: { weekData, weekLabels, weekTotal: Math.round(weekCurrent), weekGrowth },
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
