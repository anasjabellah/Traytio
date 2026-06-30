'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma, CommandeStatus } from '@prisma/client';
import type { ActionResponse, Commande, GetCommandesParams } from '@/features/commandes/types';
import { serializeCommande } from '@/features/commandes/lib/serialize-commande';
import { COMMANDE_DEFAULT_PAGE_SIZE } from '@/features/commandes/constants';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';

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

    const [total, commandes, statsRows] = await Promise.all([
      prisma.commande.count({ where }),
      prisma.commande.findMany({
        where,
        select,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.commande.findMany({
        where: { organizationId, createdAt: { gte: prevMonthStart } },
        select: { status: true, totalAmount: true, remainingAmount: true, eventDate: true, createdAt: true },
      }),
    ]);

    // ── Stats ──
    const currentRows = statsRows.filter((r) => r.createdAt >= monthStart);
    const prevRows = statsRows.filter((r) => r.createdAt >= prevMonthStart && r.createdAt < monthStart);

    const calcStats = (rows: typeof currentRows) => {
      const total = rows.length;
      const active = rows.filter((r) => r.status !== 'CANCELLED' && r.status !== 'DELIVERED' && r.status !== 'DRAFT').length;
      const upcomingCount = rows.filter((r) => r.eventDate && new Date(r.eventDate) >= now && r.status !== 'CANCELLED').length;
      const revenue = rows.reduce((s, r) => s + Number(r.totalAmount), 0);
      const remaining = rows.reduce((s, r) => s + Number(r.remainingAmount), 0);
      const nonDraft = rows.filter((r) => r.status !== 'DRAFT').length;
      const converted = rows.filter((r) => r.status !== 'DRAFT' && r.status !== 'CANCELLED' && r.status !== 'QUOTED').length;
      const conversionRate = nonDraft > 0 ? Math.round((converted / nonDraft) * 100) : 0;
      return { total, active, upcomingCount, revenue, remaining, conversionRate };
    };

    const buildSparkline = (rows: typeof currentRows): number[] => {
      const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const buckets = new Array(days).fill(0);
      for (const r of rows) {
        const d = new Date(r.createdAt).getDate();
        buckets[d - 1] += Number(r.totalAmount);
      }
      return buckets;
    };

    // ── Map commandes ──
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
          currentMonth: calcStats(currentRows),
          previousMonth: calcStats(prevRows),
          sparklines: { revenue: buildSparkline(currentRows), total: [] },
        },
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'An error occurred';
    return { success: false, error: msg };
  }
}
