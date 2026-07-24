import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { tzDateKey, tzMonthKey } from '@/lib/date-utils';
import { computeKpi, buildMonthlySparkline, buildMonthlySparklineFromMap } from '@/features/dashboard/lib/kpi-engine';
import type { DashboardData } from '@/features/dashboard/types';
import type { CommandeStatus } from '@prisma/client';

const COMMANDE_ACTIVE_STATUSES: CommandeStatus[] = ['QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'READY'];
const COMMANDE_REVENUE_STATUSES = { notIn: ['CANCELLED'] as CommandeStatus[] };

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

function getTimeBase() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const startOfToday = new Date(currentYear, now.getMonth(), now.getDate());
  const endOfToday = new Date(currentYear, now.getMonth(), now.getDate() + 1);
  const twentyFourMonthsAgo = new Date(currentYear, now.getMonth() - 23, 1);
  const [curTzY, curTzM] = tzDateKey(new Date()).split('-').map(Number);
  const last8Months: { key: string; start: Date }[] = [];
  for (let i = 7; i >= 0; i--) {
    let y = curTzY, m = curTzM - i;
    while (m <= 0) { y--; m += 12; }
    const key = `${y}-${String(m).padStart(2, '0')}`;
    last8Months.push({ key, start: new Date(y, m - 1, 1) });
  }
  const eightMonthsAgo = last8Months[0].start;
  const monthKeys = last8Months.map((m) => m.key);
  return { now, currentYear, startOfYear, startOfToday, endOfToday, twentyFourMonthsAgo, eightMonthsAgo, monthKeys };
}

const getOrgAndCheck = cache(async () => {
  const organizationId = await getOrganizationId();
  await assertCan('dashboard', 'view');
  return organizationId;
});

function buildMonthMap(paymentRows: { amount: unknown; createdAt: Date }[]) {
  const monthlyMap = new Map<string, number>();
  const paidMonthlyMap = new Map<string, number>();
  for (const pmt of paymentRows) {
    const monthKey = tzMonthKey(new Date(pmt.createdAt));
    const val = Number(pmt.amount);
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + val);
    paidMonthlyMap.set(monthKey, (paidMonthlyMap.get(monthKey) || 0) + val);
  }
  return { monthlyMap, paidMonthlyMap };
}

export const fetchKpiSection = cache(async () => {
  try {
    const organizationId = await getOrgAndCheck();
    const t = getTimeBase();

    const [
      paymentAgg,
      paymentRows,
      clientCount,
      activeCommandesCount,
      pendingAgg,
      confirmedEventsCount,
      completedEventsCount,
      perfEventRows,
      clientCountsRaw,
      perfCommandeRows,
      perfDepositRows,
    ] = await Promise.all([
      prisma.payment.aggregate({ where: { organizationId, status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.payment.findMany({
        where: { organizationId, status: 'COMPLETED', createdAt: { gte: t.twentyFourMonthsAgo } },
        select: { amount: true, createdAt: true },
      }),
      prisma.client.count({ where: { organizationId } }),
      prisma.commande.count({ where: { organizationId, status: { in: COMMANDE_ACTIVE_STATUSES } } }),
      prisma.commande.aggregate({
        where: { organizationId, remainingAmount: { gt: 0 }, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
        _sum: { remainingAmount: true },
      }),
      prisma.event.count({ where: { organizationId, status: 'CONFIRMED' } }),
      prisma.event.count({ where: { organizationId, status: 'COMPLETED' } }),
      prisma.event.findMany({
        where: { organizationId, createdAt: { gte: t.eightMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
        SELECT DATE_TRUNC('month', "createdAt") AS month, COUNT(*)::int AS count
        FROM "clients"
        WHERE "organizationId" = ${organizationId} AND "createdAt" >= ${t.eightMonthsAgo}
        GROUP BY 1 ORDER BY 1
      `,
      prisma.commande.findMany({
        where: { organizationId, status: { in: COMMANDE_ACTIVE_STATUSES }, createdAt: { gte: t.eightMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.commande.findMany({
        where: { organizationId, remainingAmount: { gt: 0 }, status: { in: ['CONFIRMED', 'IN_PROGRESS'] }, createdAt: { gte: t.eightMonthsAgo } },
        select: { createdAt: true, remainingAmount: true },
      }),
    ]);

    const { monthlyMap, paidMonthlyMap } = buildMonthMap(paymentRows);
    const totalRevenue = Math.round(Number(paymentAgg._sum?.amount || 0));
    const paymentsReceived = totalRevenue;
    const eventsTotal = confirmedEventsCount + completedEventsCount;

    const perfRevenue = buildMonthlySparklineFromMap(monthlyMap, t.monthKeys);
    const perfPayments = buildMonthlySparklineFromMap(paidMonthlyMap, t.monthKeys);
    const perfEvents = buildMonthlySparkline(perfEventRows, t.monthKeys);

    const clientCountMap = new Map<string, number>();
    for (const row of (clientCountsRaw as Array<{ month: Date; count: bigint }>)) {
      clientCountMap.set(tzMonthKey(new Date(row.month)), Number(row.count));
    }
    const perfClients = buildMonthlySparklineFromMap(clientCountMap, t.monthKeys);
    const perfCommandes = buildMonthlySparkline(perfCommandeRows, t.monthKeys);
    const perfDeposits = buildMonthlySparkline(perfDepositRows, t.monthKeys, (c) => Number(c.remainingAmount));

    const revenueKpi = computeKpi(perfRevenue);
    const commandesKpi = computeKpi(perfCommandes);
    const eventsKpi = computeKpi(perfEvents);
    const clientsKpi = computeKpi(perfClients);
    const depositsKpi = computeKpi(perfDeposits);
    const paymentsKpi = computeKpi(perfPayments);

    return [
      {
        label: "Chiffre d'affaires",
        value: totalRevenue, prefix: 'MAD',
        delta: revenueKpi.delta, trend: revenueKpi.trend, spark: revenueKpi.spark,
        icon: 'wallet', sensitive: true,
      },
      {
        label: 'Commandes actives',
        value: activeCommandesCount,
        delta: commandesKpi.delta, trend: commandesKpi.trend, spark: commandesKpi.spark,
        icon: 'receipt', sensitive: true,
      },
      {
        label: 'Événements',
        value: eventsTotal,
        delta: eventsKpi.delta, trend: eventsKpi.trend, spark: eventsKpi.spark,
        icon: 'party', sensitive: true,
      },
      {
        label: 'Clients actifs',
        value: clientCount,
        delta: clientsKpi.delta, trend: clientsKpi.trend, spark: clientsKpi.spark,
        icon: 'users', sensitive: true,
      },
      {
        label: 'Acomptes en attente',
        value: Math.round(Number(pendingAgg._sum.remainingAmount || 0)), prefix: 'MAD',
        delta: depositsKpi.delta, trend: depositsKpi.trend, spark: depositsKpi.spark,
        icon: 'clock', sensitive: true,
      },
      {
        label: 'Paiements encaissés',
        value: paymentsReceived, prefix: 'MAD',
        delta: paymentsKpi.delta, trend: paymentsKpi.trend, spark: paymentsKpi.spark,
        icon: 'banknote', sensitive: true,
      },
    ];
  } catch {
    return null;
  }
});

export const fetchRevenueChartSection = cache(async () => {
  try {
    const organizationId = await getOrgAndCheck();
    const t = getTimeBase();

    const paymentRows = await prisma.payment.findMany({
      where: { organizationId, status: 'COMPLETED', createdAt: { gte: t.twentyFourMonthsAgo } },
      select: { amount: true, createdAt: true },
    });

    const dailyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    const paidMonthlyMap = new Map<string, number>();
    for (const pmt of paymentRows) {
      const d = new Date(pmt.createdAt);
      const dayKey = tzDateKey(d);
      const monthKey = tzMonthKey(d);
      const val = Number(pmt.amount);
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + val);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + val);
      paidMonthlyMap.set(monthKey, (paidMonthlyMap.get(monthKey) || 0) + val);
    }

    const weekData: number[] = [];
    const weekLabels: string[] = [];
    let weekCurrent = 0;
    let weekPrevious = 0;
    for (let i = 13; i >= 0; i--) {
      const d = new Date(t.now);
      d.setDate(d.getDate() - i);
      const dayKey = tzDateKey(d);
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

    return {
      weekData,
      weekLabels,
      weekTotal: Math.round(weekCurrent),
      weekGrowth,
      revenueMaps: {
        daily: Object.fromEntries(dailyMap),
        monthly: Object.fromEntries(monthlyMap),
        paidMonthly: Object.fromEntries(paidMonthlyMap),
      },
    };
  } catch {
    return null;
  }
});

export const fetchRecentCommandesSection = cache(async () => {
  try {
    const organizationId = await getOrgAndCheck();
    const rows = await prisma.commande.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, number: true, createdAt: true, totalAmount: true, status: true,
        client: { select: { name: true } },
      },
    });
    return rows.map((c) => ({
      id: c.id,
      number: c.number || c.id.slice(0, 8),
      clientName: c.client?.name || 'Client',
      date: c.createdAt,
      total: Number(c.totalAmount),
      status: c.status,
    }));
  } catch {
    return null;
  }
});

export const fetchPaymentsSection = cache(async () => {
  try {
    const organizationId = await getOrgAndCheck();
    const [paymentAgg, pendingAgg, totalBudgetAgg] = await Promise.all([
      prisma.payment.aggregate({ where: { organizationId, status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.commande.aggregate({
        where: { organizationId, remainingAmount: { gt: 0 }, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
        _sum: { remainingAmount: true },
      }),
      prisma.event.aggregate({ where: { organizationId }, _sum: { budget: true } }),
    ]);
    const paid = Math.round(Number(paymentAgg._sum?.amount || 0));
    const pending = Math.round(Number(pendingAgg._sum.remainingAmount || 0));
    const totalBudget = Math.round(Number(totalBudgetAgg._sum?.budget || 0));
    return { paid, pending, remaining: totalBudget - paid - pending };
  } catch {
    return null;
  }
});

export const fetchUpcomingEventsSection = cache(async () => {
  try {
    const organizationId = await getOrgAndCheck();
    const now = new Date();
    const events = await prisma.event.findMany({
      where: { organizationId, startDate: { gt: now } },
      orderBy: { startDate: 'asc' },
      take: 3,
      select: {
        id: true, name: true, startDate: true, guestCount: true, status: true,
        client: { select: { name: true } },
      },
    });
    return events.map((e) => ({
      id: e.id,
      name: e.name,
      clientName: e.client?.name || null,
      startDate: e.startDate,
      guestCount: e.guestCount,
      status: e.status,
    }));
  } catch {
    return null;
  }
});

export const fetchBusinessHealthSection = cache(async (): Promise<DashboardData['health'] | null> => {
  try {
    const organizationId = await getOrgAndCheck();
    const t = getTimeBase();

    const [paymentRows, topItemAgg, bestClient, yearCommandeRows] = await Promise.all([
      prisma.payment.findMany({
        where: { organizationId, status: 'COMPLETED', createdAt: { gte: t.twentyFourMonthsAgo } },
        select: { amount: true, createdAt: true },
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
      prisma.commande.findMany({
        where: { organizationId, status: COMMANDE_REVENUE_STATUSES, createdAt: { gte: t.startOfYear } },
        select: { totalAmount: true, paidAmount: true, createdAt: true },
      }),
    ]);

    const monthlyMap = new Map<string, number>();
    for (const pmt of paymentRows) {
      const key = tzMonthKey(new Date(pmt.createdAt));
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(pmt.amount));
    }

    const paidCommandes = yearCommandeRows.filter((c) => c.totalAmount);
    const avgEventValue = paidCommandes.length > 0
      ? Math.round(paidCommandes.reduce((s, c) => s + Number(c.totalAmount), 0) / paidCommandes.length)
      : 0;
    const totalAcompte = yearCommandeRows.reduce((s, c) => s + Number(c.paidAmount), 0);
    const avgDeposit = paidCommandes.length > 0 ? Math.round(totalAcompte / paidCommandes.length) : 0;

    const thisMonthKey = tzMonthKey(t.now);
    const lastMonthDate = new Date(t.now.getFullYear(), t.now.getMonth() - 1, 1);
    const lastMonthKey = tzMonthKey(lastMonthDate);
    const thisMonthRev = monthlyMap.get(thisMonthKey) || 0;
    const lastMonthRev = monthlyMap.get(lastMonthKey) || 0;
    const monthlyGrowth = lastMonthRev > 0
      ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100)
      : 0;

    return {
      avgEventValue,
      avgDeposit,
      topMenuItem: topItemAgg.length > 0 ? topItemAgg[0].name : null,
      topMenuCount: topItemAgg.length > 0 ? topItemAgg[0]._sum.quantity : null,
      bestClientName: bestClient?.name || null,
      bestClientTotal: bestClient ? Math.round(Number(bestClient.totalSpent)) : null,
      monthlyGrowth,
    };
  } catch {
    return null;
  }
});

export const fetchPerformanceSection = cache(async () => {
  try {
    const organizationId = await getOrgAndCheck();
    const t = getTimeBase();

    const [
      paymentAgg,
      paymentRows,
      confirmedEventsCount,
      clientCount,
      perfEventRows,
      clientCountsRaw,
      upcomingEvents,
    ] = await Promise.all([
      prisma.payment.aggregate({ where: { organizationId, status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.payment.findMany({
        where: { organizationId, status: 'COMPLETED', createdAt: { gte: t.twentyFourMonthsAgo } },
        select: { amount: true, createdAt: true },
      }),
      prisma.event.count({ where: { organizationId, status: 'CONFIRMED' } }),
      prisma.client.count({ where: { organizationId } }),
      prisma.event.findMany({
        where: { organizationId, createdAt: { gte: t.eightMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
        SELECT DATE_TRUNC('month', "createdAt") AS month, COUNT(*)::int AS count
        FROM "clients"
        WHERE "organizationId" = ${organizationId} AND "createdAt" >= ${t.eightMonthsAgo}
        GROUP BY 1 ORDER BY 1
      `,
      prisma.event.findMany({
        where: { organizationId, startDate: { gt: t.now } },
        orderBy: { startDate: 'asc' },
        take: 3,
        select: { id: true },
      }),
    ]);

    const totalRevenue = Math.round(Number(paymentAgg._sum?.amount || 0));
    const { monthlyMap, paidMonthlyMap } = buildMonthMap(paymentRows);

    const perfRevenue = buildMonthlySparklineFromMap(monthlyMap, t.monthKeys);
    const perfPayments = buildMonthlySparklineFromMap(paidMonthlyMap, t.monthKeys);
    const perfEvents = buildMonthlySparkline(perfEventRows, t.monthKeys);

    const clientCountMap = new Map<string, number>();
    for (const row of (clientCountsRaw as Array<{ month: Date; count: bigint }>)) {
      clientCountMap.set(tzMonthKey(new Date(row.month)), Number(row.count));
    }
    const perfClients = buildMonthlySparklineFromMap(clientCountMap, t.monthKeys);

    return {
      perfRevenue,
      perfEvents,
      perfClients,
      perfPayments,
      totalRevenue,
      confirmedEvents: confirmedEventsCount,
      upcomingEventsCount: upcomingEvents.length,
      activeClients: clientCount,
      paymentsReceived: totalRevenue,
    };
  } catch {
    return null;
  }
});

export const fetchSidebarSection = cache(async () => {
  try {
    const organizationId = await getOrgAndCheck();
    const t = getTimeBase();

    const [todayEvents, recentActivities, recentCommandes, yearEvents] = await Promise.all([
      prisma.event.findMany({
        where: { organizationId, startDate: { gte: t.startOfToday, lt: t.endOfToday } },
        select: { id: true, name: true, startDate: true, guestCount: true },
      }),
      prisma.commandeActivity.findMany({
        where: { commande: { organizationId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, action: true, description: true, createdAt: true },
      }),
      prisma.commande.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, number: true, createdAt: true },
      }),
      prisma.event.findMany({
        where: { organizationId, createdAt: { gte: t.startOfYear } },
        select: { status: true, budget: true, guestCount: true },
      }),
    ]);

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

    const totalQuickEvents = yearEvents.length;
    const eventsWithBudget = yearEvents.filter((e) => e.budget);
    const avgBudget = eventsWithBudget.length > 0
      ? Math.round(eventsWithBudget.reduce((s, e) => s + Number(e.budget), 0) / eventsWithBudget.length)
      : 0;
    const eventsWithGuests = yearEvents.filter((e) => e.guestCount);
    const avgGuests = eventsWithGuests.length > 0
      ? Math.round(eventsWithGuests.reduce((s, e) => s + (e.guestCount || 0), 0) / eventsWithGuests.length)
      : 0;
    const compEventsFiltered = yearEvents.filter((e) => e.status === 'COMPLETED').length;
    const completionRate = totalQuickEvents > 0 ? Math.round((compEventsFiltered / totalQuickEvents) * 100) : 0;

    return {
      todayEvents: todayEvents.map((e) => ({
        id: e.id, name: e.name, startDate: e.startDate, guestCount: e.guestCount,
      })),
      activity,
      quickStats: { avgBudget, avgGuests, completionRate },
    };
  } catch {
    return null;
  }
});
