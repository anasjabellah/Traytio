'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma, CommandeStatus } from '@prisma/client';
import type { ActionResponse, Commande, GetCommandesParams } from '@/features/commandes/types';
import { serializeCommande } from '@/features/commandes/lib/serialize-commande';
import { COMMANDE_DEFAULT_PAGE_SIZE } from '@/features/commandes/constants';
import { getOrganizationId } from '@/lib/get-organization-id';
import { COMMANDE } from '@/lib/notify/messages';
import { assertCan } from '@/lib/assert-role';
import { buildMonthlySparkline, buildMonthKeys } from '@/features/dashboard/lib/kpi-engine';

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

export async function getCommandesPage(params: GetCommandesParams): Promise<ActionResponse<CommandesPageResult>> {
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

    const [total, commandes, currentGroups, prevGroups, currentUpcoming, prevUpcoming, sparklineRows] = await Promise.all([
      prisma.commande.count({ where }),
      prisma.commande.findMany({
        where,
        select,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      // Current month stats: groupBy status (aggregated at DB level)
      prisma.commande.groupBy({
        by: ['status'],
        where: { organizationId, createdAt: { gte: monthStart } },
        _count: true,
        _sum: { totalAmount: true, remainingAmount: true },
      }),
      // Previous month stats: groupBy status
      prisma.commande.groupBy({
        by: ['status'],
        where: { organizationId, createdAt: { gte: prevMonthStart, lt: monthStart } },
        _count: true,
        _sum: { totalAmount: true, remainingAmount: true },
      }),
      // Current month upcoming count (eventDate filter, not groupable)
      prisma.commande.count({
        where: { organizationId, createdAt: { gte: monthStart }, eventDate: { gt: now }, status: { not: 'CANCELLED' } },
      }),
      // Previous month upcoming count
      prisma.commande.count({
        where: { organizationId, createdAt: { gte: prevMonthStart, lt: monthStart }, eventDate: { gt: now }, status: { not: 'CANCELLED' } },
      }),
      // Historical data for monthly perf arrays (last 8 months)
      prisma.commande.findMany({
        where: { organizationId, createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 7, 1) } },
        select: { totalAmount: true, remainingAmount: true, status: true, eventDate: true, createdAt: true },
      }),
    ]);

    type StatusAgg = { status: string; _count: number; _sum: { totalAmount: number | null; remainingAmount: number | null } };

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

    const buildMonthlyConversionRate = (rows: typeof sparklineRows, keys: string[]): number[] => {
      const monthBuckets = new Map<string, { nonDraft: number; converted: number }>();
      for (const row of rows) {
        const d = new Date(row.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const bucket = monthBuckets.get(key) ?? { nonDraft: 0, converted: 0 };
        if (row.status !== 'DRAFT') {
          bucket.nonDraft += 1;
          if (!['DRAFT', 'CANCELLED', 'QUOTED'].includes(row.status)) {
            bucket.converted += 1;
          }
        }
        monthBuckets.set(key, bucket);
      }
      return keys.map((key) => {
        const b = monthBuckets.get(key);
        if (!b || b.nonDraft === 0) return 0;
        return Math.round((b.converted / b.nonDraft) * 100);
      });
    };

    const monthKeys = buildMonthKeys(8);

    const perfTotal = buildMonthlySparkline(sparklineRows, monthKeys);

    const perfActive = buildMonthlySparkline(sparklineRows, monthKeys, (r) =>
      !['CANCELLED', 'DELIVERED', 'DRAFT'].includes(r.status) ? 1 : 0,
    );

    const perfUpcoming = buildMonthlySparkline(sparklineRows, monthKeys, (r) =>
      r.eventDate && new Date(r.eventDate) > now && r.status !== 'CANCELLED' ? 1 : 0,
    );

    const perfRevenue = buildMonthlySparkline(sparklineRows, monthKeys, (r) =>
      r.status !== 'CANCELLED' ? Number(r.totalAmount) : 0,
    );

    const perfRemaining = buildMonthlySparkline(sparklineRows, monthKeys, (r) =>
      Number(r.remainingAmount),
    );

    const perfConversion = buildMonthlyConversionRate(sparklineRows, monthKeys);

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
          currentMonth: calcStats(currentGroups as unknown as StatusAgg[], currentUpcoming),
          previousMonth: calcStats(prevGroups as unknown as StatusAgg[], prevUpcoming),
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
    const msg = error instanceof Error ? error.message : COMMANDE.UNEXPECTED_ERROR;
    return { success: false, error: msg };
  }
}
