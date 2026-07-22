'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma, CommandeStatus } from '@prisma/client';
import type { ActionResponse, Commande, GetCommandesParams } from '@/features/commandes/types';
import { serializeCommande } from '@/features/commandes/lib/serialize-commande';
import { COMMANDE_DEFAULT_PAGE_SIZE } from '@/features/commandes/constants';
import { getOrganizationId } from '@/lib/get-organization-id';
import { COMMANDE } from '@/lib/notify/messages';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';
import { buildMonthKeys } from '@/features/dashboard/lib/kpi-engine';
import { tzMonthKey } from '@/lib/date-utils';

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
  perfTotal: number[];
  perfActive: number[];
  perfUpcoming: number[];
  perfRevenue: number[];
  perfRemaining: number[];
  perfConversion: number[];
};

type CommandesPageResult = {
  commandes: Commande[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: CommandeStats;
};

type StatusAgg = { status: string; _count: number; _sum: { totalAmount: number | null; remainingAmount: number | null } };

async function getCommandesPageHandler(params: GetCommandesParams): Promise<ActionResponse<CommandesPageResult>> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('commandes', 'read');

    const {
      search, page = 1, limit = COMMANDE_DEFAULT_PAGE_SIZE,
      sortBy = 'createdAt', sortOrder = 'desc', status,
    } = params;

    const skip = (page - 1) * limit;
    const where: Prisma.CommandeWhereInput = { organizationId };

    if (status) {
      where.status = status as CommandeStatus;
    }

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { client: { phone: { contains: search, mode: 'insensitive' } } },
        { event: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (params.clientId) {
      where.clientId = params.clientId;
    }

    if (params.eventId) {
      where.eventId = params.eventId;
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const select = {
      id: true, number: true, status: true, eventType: true, eventDate: true,
      guestCount: true, totalAmount: true, acompteAmount: true, paidAmount: true,
      remainingAmount: true, discountType: true, discountAmount: true,
      createdAt: true, updatedAt: true, clientId: true, eventId: true,
      menuId: true, menuName: true, pricePerPerson: true, location: true, notes: true,
      transportFees: true, deliveryFees: true, equipmentFees: true, discountValue: true,
      taxRate: true, taxLabel: true, taxAmount: true, clientBudget: true,
      contactName: true, contactPhone: true, internalNotes: true, clientNotes: true,
      pdfUrl: true, sentAt: true, sentVia: true, acomptePercent: true, organizationId: true,
      client: { select: { name: true, phone: true } },
      event: { select: { name: true, status: true } },
    } satisfies Prisma.CommandeSelect;

    // 7 original queries → 3: count, findMany (paginated list), sparklineRows (8-month historical).
    // groupBy months (Q3/Q4) and upcoming counts (Q5/Q6) are derived from sparklineRows in JS.
    const [total, commandes, sparklineRows] = await Promise.all([
      prisma.commande.count({ where }),
      prisma.commande.findMany({
        where,
        select,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.commande.findMany({
        where: { organizationId, createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 7, 1) } },
        select: { totalAmount: true, remainingAmount: true, status: true, eventDate: true, createdAt: true },
      }),
    ]);

    // Derive monthly status aggregates from sparklineRows (replaces 2 groupBy queries)
    const aggregateByStatus = (rows: typeof sparklineRows) => {
      const map = new Map<string, { _count: number; _sum: { totalAmount: number; remainingAmount: number } }>();
      for (const row of rows) {
        const existing = map.get(row.status) ?? { _count: 0, _sum: { totalAmount: 0, remainingAmount: 0 } };
        existing._count += 1;
        existing._sum.totalAmount += Number(row.totalAmount);
        existing._sum.remainingAmount += Number(row.remainingAmount);
        map.set(row.status, existing);
      }
      return Array.from(map.entries()).map(([s, a]) => ({ status: s, ...a }));
    };

    const currentGroups = aggregateByStatus(sparklineRows.filter(r => r.createdAt >= monthStart));
    const prevGroups = aggregateByStatus(sparklineRows.filter(r => r.createdAt >= prevMonthStart && r.createdAt < monthStart));

    // Derive upcoming counts from sparklineRows (replaces 2 count queries)
    const currentUpcoming = sparklineRows.filter(
      r => r.createdAt >= monthStart && r.eventDate && new Date(r.eventDate) > now && r.status !== 'CANCELLED',
    ).length;
    const prevUpcoming = sparklineRows.filter(
      r => r.createdAt >= prevMonthStart && r.createdAt < monthStart && r.eventDate && new Date(r.eventDate) > now && r.status !== 'CANCELLED',
    ).length;

    const calcStats = (groups: StatusAgg[], upcomingCount: number) => {
      const total = groups.reduce((s, g) => s + g._count, 0);
      const active = groups
        .filter((g) => !['CANCELLED', 'DELIVERED', 'DRAFT'].includes(g.status))
        .reduce((s, g) => s + g._count, 0);
      const revenue = groups
        .filter((g) => g.status !== 'CANCELLED')
        .reduce((s, g) => s + Number(g._sum.totalAmount || 0), 0);
      const remaining = groups.reduce((s, g) => s + Number(g._sum.remainingAmount || 0), 0);
      const nonDraft = groups
        .filter((g) => g.status !== 'DRAFT')
        .reduce((s, g) => s + g._count, 0);
      const converted = groups
        .filter((g) => !['DRAFT', 'CANCELLED', 'QUOTED'].includes(g.status))
        .reduce((s, g) => s + g._count, 0);
      const conversionRate = nonDraft > 0 ? Math.round((converted / nonDraft) * 100) : 0;
      return { total, active, upcomingCount, revenue, remaining, conversionRate };
    };

    const buildAllSparklines = (
      rows: typeof sparklineRows,
      keys: string[],
      referenceDate: Date,
    ) => {
      const total = new Map<string, number>();
      const active = new Map<string, number>();
      const upcoming = new Map<string, number>();
      const revenue = new Map<string, number>();
      const remaining = new Map<string, number>();
      const convNonDraft = new Map<string, number>();
      const convConverted = new Map<string, number>();

      for (const row of rows) {
        const key = tzMonthKey(new Date(row.createdAt));

        total.set(key, (total.get(key) ?? 0) + 1);

        if (!['CANCELLED', 'DELIVERED', 'DRAFT'].includes(row.status)) {
          active.set(key, (active.get(key) ?? 0) + 1);
        }

        if (row.eventDate && new Date(row.eventDate) > referenceDate && row.status !== 'CANCELLED') {
          upcoming.set(key, (upcoming.get(key) ?? 0) + 1);
        }

        if (row.status !== 'CANCELLED') {
          revenue.set(key, (revenue.get(key) ?? 0) + Number(row.totalAmount));
        }

        remaining.set(key, (remaining.get(key) ?? 0) + Number(row.remainingAmount));

        if (row.status !== 'DRAFT') {
          convNonDraft.set(key, (convNonDraft.get(key) ?? 0) + 1);
          if (!['DRAFT', 'CANCELLED', 'QUOTED'].includes(row.status)) {
            convConverted.set(key, (convConverted.get(key) ?? 0) + 1);
          }
        }
      }

      return {
        perfTotal: keys.map((k) => Math.round(total.get(k) ?? 0)),
        perfActive: keys.map((k) => Math.round(active.get(k) ?? 0)),
        perfUpcoming: keys.map((k) => Math.round(upcoming.get(k) ?? 0)),
        perfRevenue: keys.map((k) => Math.round(revenue.get(k) ?? 0)),
        perfRemaining: keys.map((k) => Math.round(remaining.get(k) ?? 0)),
        perfConversion: keys.map((k) => {
          const nd = convNonDraft.get(k) ?? 0;
          if (nd === 0) return 0;
          return Math.round(((convConverted.get(k) ?? 0) / nd) * 100);
        }),
      };
    };

    const monthKeys = buildMonthKeys(8);

    const {
      perfTotal, perfActive, perfUpcoming, perfRevenue, perfRemaining, perfConversion,
    } = buildAllSparklines(sparklineRows, monthKeys, now);

    const result: Commande[] = commandes.map(serializeCommande);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        commandes: result,
        total,
        page,
        limit,
        totalPages,
        stats: {
          currentMonth: calcStats(currentGroups as StatusAgg[], currentUpcoming),
          previousMonth: calcStats(prevGroups as StatusAgg[], prevUpcoming),
          perfTotal,
          perfActive,
          perfUpcoming,
          perfRevenue,
          perfRemaining,
          perfConversion,
        },
      },
    };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, COMMANDE.UNEXPECTED_ERROR) };
  }
}

export const getCommandesPage = withActionGuard(getCommandesPageHandler, { name: 'commandes:read' })
