'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { ActionResponse, Event, PaginatedEvents, GetEventsParams } from '@/features/events/types';
import { EVENT_DEFAULT_PAGE_SIZE } from '@/features/events/constants';
import { getOrganizationId } from '@/lib/get-organization-id';
import { computeHealthScore, computePaymentStatus } from '@/features/events/types';
import { startTimer, endTimer } from '@/lib/log-timer';

let _getEventsCalls = 0;

export async function getEvents(params: GetEventsParams): Promise<ActionResponse<PaginatedEvents>> {
  try {
    const totalTimer = startTimer('getEvents:total');
    const orgTimer = startTimer('getEvents:getOrganizationId');
    const organizationId = await getOrganizationId();
    endTimer(orgTimer);

    const { search, page = 1, limit = EVENT_DEFAULT_PAGE_SIZE, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;

    _getEventsCalls++;
    if (_getEventsCalls % 20 === 0) console.warn(`[CALL_TRACE] getEvents called ${_getEventsCalls} times`);

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

    const countTimer = startTimer('getEvents:count');
    const total = await prisma.event.count({ where });
    endTimer(countTimer);

    const listTimer = startTimer('getEvents:findMany');
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
    endTimer(listTimer);

    const now = new Date();
    const result: Event[] = events.map((event: typeof events[0]) => {
      const budget = Number(event.budget) || null;
      const commandes = (event.commandes || []).map((c) => ({
        ...c,
        totalAmount: Number(c.totalAmount),
        paidAmount: Number(c.paidAmount),
        remainingAmount: Number(c.remainingAmount),
      }));
      const daysUntil = event.startDate
        ? Math.ceil((new Date(event.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const totalPaid = commandes.reduce((s, c) => s + Number(c.paidAmount ?? 0), 0);
      const totalRemaining = commandes.reduce((s, c) => s + Number(c.remainingAmount ?? 0), 0);
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
        paymentStatus: computePaymentStatus(commandes),
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
        totalRemaining,
      };
    });

    const totalPages = Math.ceil(total / limit);

    endTimer(totalTimer);
    return { success: true, data: { data: result, total, page, limit, totalPages } };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
}