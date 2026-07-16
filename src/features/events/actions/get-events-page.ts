'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { ActionResponse, Event } from '@/features/events/types';
import { EVENT_DEFAULT_PAGE_SIZE } from '@/features/events/constants';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';
import { computeHealthScore } from '@/features/events/types';
import { EVENT } from '@/lib/notify/messages';
import { buildMonthlySparkline, buildMonthKeys } from '@/features/dashboard/lib/kpi-engine';

const getEventsPageSchema = z.object({
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
  status: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  budgetMin: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional(),
});

export type EventsPageStats = {
  totalEvents: number;
  confirmedEvents: number;
  upcomingEvents: number;
  thisMonthEvents: number;
  totalBudget: number;
  avgBudget: number;
  activeClients: number;
  confirmationRate: number;
  eventGrowth: number;
  perfTotal: number[];
  perfUpcoming: number[];
  perfConfirmed: number[];
  perfBudget: number[];
  perfActive: number[];
};

export type EventsPageAlert = {
  type: 'warn' | 'danger' | 'info';
  title: string;
  text: string;
};

export type EventsPageResult = {
  events: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: EventsPageStats;
  todayEvents: Event[];
  upcomingSorted: Event[];
  alerts: EventsPageAlert[];
};

export type GetEventsPageParams = {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  status?: string | null;
  type?: string | null;
  dateFrom?: string;
  dateTo?: string;
  budgetMin?: string;
  budgetMax?: string;
};

function mapEvent(event: any): Event {
  const budget = Number(event.budget) || null;
  const startTime = event.startDate?.getTime() ?? 0;
  const daysUntil = startTime ? Math.ceil((startTime - Date.now()) / 86400000) : 0;

  let totalPaid = 0;
  let totalDue = 0;
  const commandes = (event.commandes || []).map((c: any) => {
    const paid = Number(c.paidAmount ?? 0);
    const remaining = Number(c.remainingAmount ?? 0);
    totalPaid += paid;
    totalDue += paid + remaining;
    return { ...c, totalAmount: Number(c.totalAmount), paidAmount: paid, remainingAmount: remaining };
  });

  const paymentStatus: 'UNPAID' | 'PAID' | 'PARTIAL' = commandes.length === 0 || totalDue === 0
    ? 'UNPAID'
    : totalPaid >= totalDue
      ? 'PAID'
      : 'PARTIAL';

  return {
    id: event.id,
    organizationId: event.organizationId,
    clientId: event.clientId,
    name: event.name,
    type: event.type,
    status: event.status,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    guestCount: event.guestCount,
    budget,
    contactPerson: event.contactPerson ?? null,
    contactPhone: event.contactPhone ?? null,
    notes: event.notes ?? null,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    clientName: event.client?.name ?? null,
    clientPhone: event.client?.phone ?? null,
    paymentStatus,
    healthScore: computeHealthScore({
      clientId: event.clientId,
      startDate: event.startDate,
      budget,
      guestCount: event.guestCount,
      commandesCount: commandes.length,
    }),
    daysUntil,
    hasLinkedCommande: commandes.length > 0,
    totalPaid,
    totalRemaining: totalDue - totalPaid,
  };
}

function computeAlerts(events: Event[], now: Date): EventsPageAlert[] {
  const result: EventsPageAlert[] = [];
  const seen = new Set<string>();
  const add = (type: EventsPageAlert['type'], title: string, text: string) => {
    const key = `${title}:${text}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push({ type, title, text });
  };

  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (const e of events) {
    const d = new Date(e.startDate);
    if (d > now && d <= sevenDaysFromNow) {
      add('warn', '⚠ Événement imminent', `${e.name} — ${e.clientName || 'Client'} (J-${Math.ceil((d.getTime() - now.getTime()) / 86400000)})`);
    }
    if (e.paymentStatus === 'UNPAID' && e.status !== 'DRAFT' && e.status !== 'CANCELLED') {
      add('danger', '⚠ Paiement manquant', `${e.name} — ${e.clientName || 'Client'}`);
    }
    if (!e.clientId) {
      add('info', '⚠ Client manquant', e.name);
    }
    if (!e.budget || Number(e.budget) === 0) {
      add('info', '⚠ Budget manquant', e.name);
    }
    if (!e.guestCount || e.guestCount === 0) {
      add('info', '⚠ Invités manquants', e.name);
    }
    if (!e.hasLinkedCommande && e.status !== 'DRAFT' && e.status !== 'CANCELLED') {
      add('warn', '⚠ Commande manquante', e.name);
    }
  }

  const dateMap = new Map<string, string[]>();
  for (const e of events) {
    const key = new Date(e.startDate).toLocaleDateString('fr-FR');
    if (!dateMap.has(key)) dateMap.set(key, []);
    dateMap.get(key)!.push(e.name);
  }
  for (const [date, names] of dateMap) {
    if (names.length >= 2) {
      add('danger', '⚠ Double réservation', `${date} — ${names.length} événements`);
    }
  }

  return result.slice(0, 4);
}

async function getEventsPageHandler(params: GetEventsPageParams): Promise<ActionResponse<EventsPageResult>> {
  try {
    getEventsPageSchema.parse(params);
    const organizationId = await getOrganizationId();
    await assertCan('events', 'read');

    const {
      search, page = 1, limit = EVENT_DEFAULT_PAGE_SIZE,
      sortBy = 'createdAt', sortOrder = 'desc',
      status, type, dateFrom, dateTo, budgetMin, budgetMax,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = { organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { client: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) where.status = status as any;
    if (type) where.type = type as any;

    if (dateFrom || dateTo) {
      where.startDate = {};
      if (dateFrom) where.startDate.gte = new Date(dateFrom);
      if (dateTo) where.startDate.lte = new Date(dateTo);
    }

    if (budgetMin !== undefined && budgetMin !== '') {
      where.budget = { ...((where.budget as object) || {}), gte: Number(budgetMin) };
    }
    if (budgetMax !== undefined && budgetMax !== '') {
      where.budget = { ...((where.budget as object) || {}), lte: Number(budgetMax) };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthKeys = buildMonthKeys(8);
    const [firstYear, firstMonth] = monthKeys[0].split('-').map(Number);
    const historicalStart = new Date(firstYear, firstMonth - 1, 1);

    const eventSelect = {
      id: true, organizationId: true, clientId: true, name: true, type: true, status: true,
      startDate: true, endDate: true, location: true, guestCount: true, budget: true,
      contactPerson: true, contactPhone: true, notes: true, createdAt: true, updatedAt: true,
      client: { select: { name: true, phone: true } },
      commandes: { select: { status: true, totalAmount: true, paidAmount: true, remainingAmount: true } },
    } satisfies Prisma.EventSelect;

    const [
      total, events, totalBudgetResult, confirmedCount, upcomingCount,
      thisMonthCount, prevMonthCount, activeClientGroups,
      todayRaw, upcomingRaw, historicalEvents,
    ] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        select: eventSelect,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.event.aggregate({ where, _sum: { budget: true } }),
      prisma.event.count({ where: { ...where, status: 'CONFIRMED' } }),
      prisma.event.count({ where: { ...where, startDate: { gt: now } } }),
      prisma.event.count({ where: { ...where, startDate: { gte: thisMonthStart, lt: nextMonthStart } } }),
      prisma.event.count({ where: { ...where, startDate: { gte: prevMonthStart, lt: thisMonthStart } } }),
      prisma.event.findMany({
        where: { ...where, clientId: { not: null }, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
        select: { clientId: true },
        distinct: ['clientId'],
      }),
      prisma.event.findMany({
        where: { ...where, startDate: { gte: todayStart, lt: tomorrowStart } },
        select: eventSelect,
        orderBy: { startDate: 'asc' },
      }),
      prisma.event.findMany({
        where: { ...where, startDate: { gt: now } },
        select: eventSelect,
        orderBy: { startDate: 'asc' },
        take: 3,
      }),
      prisma.event.findMany({
        where: { organizationId, createdAt: { gte: historicalStart } },
        select: { createdAt: true, status: true, startDate: true, budget: true, clientId: true },
      }),
    ]);

    const mappedEvents = events.map(mapEvent);
    const todayMapped = todayRaw.map(mapEvent);
    const upcomingMapped = upcomingRaw.map(mapEvent);

    const totalBudget = Number(totalBudgetResult._sum.budget || 0);
    const avgBudget = total > 0 ? Math.round(totalBudget / total) : 0;
    const activeClients = activeClientGroups.length;
    const confirmationRate = total > 0 ? Math.round((confirmedCount / total) * 100) : 0;
    const eventGrowth = prevMonthCount > 0
      ? Math.round(((thisMonthCount - prevMonthCount) / prevMonthCount) * 100)
      : thisMonthCount > 0 ? 100 : 0;

    const nowDate = now;
    const perfTotal = buildMonthlySparkline(historicalEvents, monthKeys);
    const perfUpcoming = buildMonthlySparkline(
      historicalEvents.filter(e => e.startDate > nowDate),
      monthKeys,
    );
    const perfConfirmed = buildMonthlySparkline(
      historicalEvents.filter(e => e.status === 'CONFIRMED'),
      monthKeys,
    );
    const perfBudget = buildMonthlySparkline(
      historicalEvents,
      monthKeys,
      e => Number(e.budget ?? 0),
    );
    const perfActive = buildMonthlySparkline(
      historicalEvents.filter(e => e.clientId && (e.status === 'CONFIRMED' || e.status === 'IN_PROGRESS')),
      monthKeys,
    );

    const stats: EventsPageStats = {
      totalEvents: total,
      confirmedEvents: confirmedCount,
      upcomingEvents: upcomingCount,
      thisMonthEvents: thisMonthCount,
      totalBudget,
      avgBudget,
      activeClients,
      confirmationRate,
      eventGrowth,
      perfTotal,
      perfUpcoming,
      perfConfirmed,
      perfBudget,
      perfActive,
    };

    const alerts = computeAlerts(mappedEvents, now);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        events: mappedEvents,
        total,
        page,
        limit,
        totalPages,
        stats,
        todayEvents: todayMapped,
        upcomingSorted: upcomingMapped,
        alerts,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, EVENT.UNEXPECTED_ERROR) };
  }
}

export const getEventsPage = withActionGuard(getEventsPageHandler, { name: 'events:read' })
