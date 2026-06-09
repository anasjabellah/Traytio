'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { ActionResponse, Event, PaginatedEvents, GetEventsParams } from '@/features/events/types';
import { EVENT_DEFAULT_PAGE_SIZE } from '@/features/events/constants';
import { getOrganizationId } from '@/lib/get-organization-id';
import { computeHealthScore } from '@/features/events/types';

export async function getEvents(params: GetEventsParams): Promise<ActionResponse<PaginatedEvents>> {
  try {
    const organizationId = await getOrganizationId();

    const { search, page = 1, limit = EVENT_DEFAULT_PAGE_SIZE, sortBy = 'createdAt', sortOrder = 'desc' } = params;

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

    if (params.status) {
      where.status = params.status;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.dateFrom || params.dateTo) {
      where.startDate = {};
      if (params.dateFrom) where.startDate.gte = new Date(params.dateFrom);
      if (params.dateTo) where.startDate.lte = new Date(params.dateTo);
    }

    if (params.budgetMin !== undefined || params.budgetMax !== undefined) {
      where.budget = {};
      if (params.budgetMin !== undefined) where.budget.gte = params.budgetMin;
      if (params.budgetMax !== undefined) where.budget.lte = params.budgetMax;
    }

    const total = await prisma.event.count({ where });

    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        clientId: true,
        name: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        location: true,
        guestCount: true,
        budget: true,
        contactPerson: true,
        contactPhone: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: { name: true, phone: true },
        },
        commandes: {
          select: {
            status: true,
            totalAmount: true,
            paidAmount: true,
            remainingAmount: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    });

    const now = Date.now();
    const result: Event[] = events.map((event: typeof events[0]) => {
      const budget = Number(event.budget) || null;
      const startTime = event.startDate?.getTime() ?? 0;
      const daysUntil = startTime ? Math.ceil((startTime - now) / 86400000) : 0;

      let totalPaid = 0;
      let totalDue = 0;
      const commandes = (event.commandes || []).map((c: any) => {
        const paid = Number(c.paidAmount ?? 0);
        const remaining = Number(c.remainingAmount ?? 0);
        totalPaid += paid;
        totalDue += paid + remaining;
        return { ...c, totalAmount: Number(c.totalAmount), paidAmount: paid, remainingAmount: remaining };
      });

      const paymentStatus = commandes.length === 0 ? 'UNPAID' as const
        : totalDue === 0 ? 'UNPAID' as const
        : totalPaid >= totalDue ? 'PAID' as const
        : 'PARTIAL' as const;

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
        contactPerson: event.contactPerson,
        contactPhone: event.contactPhone,
        notes: event.notes,
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
    });

    const totalPages = Math.ceil(total / limit);

    return { success: true, data: { data: result, total, page, limit, totalPages } };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
}