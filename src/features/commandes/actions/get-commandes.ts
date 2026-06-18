'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma, CommandeStatus } from '@prisma/client';
import type { ActionResponse, Commande, GetCommandesParams, PaginatedCommandes } from '@/features/commandes/types';
import { COMMANDE_DEFAULT_PAGE_SIZE } from '@/features/commandes/constants';
import { getOrganizationId } from '@/lib/get-organization-id';

export async function getCommandes(params: GetCommandesParams): Promise<ActionResponse<PaginatedCommandes>> {
  try {
    const organizationId = await getOrganizationId();
    const { search, page = 1, limit = COMMANDE_DEFAULT_PAGE_SIZE, sortBy = 'createdAt', sortOrder = 'desc', status } = params;

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

    const [total, commandes] = await prisma.$transaction([
      prisma.commande.count({ where }),
      prisma.commande.findMany({
        where,
        select: {
          id: true,
          number: true,
          status: true,
          eventType: true,
          eventDate: true,
          guestCount: true,
          totalAmount: true,
          acompteAmount: true,
          paidAmount: true,
          remainingAmount: true,
          discountType: true,
          discountAmount: true,
          createdAt: true,
          updatedAt: true,
          clientId: true,
          eventId: true,
          menuId: true,
          menuName: true,
          pricePerPerson: true,
          location: true,
          notes: true,
          transportFees: true,
          deliveryFees: true,
          equipmentFees: true,
          discountValue: true,
          clientBudget: true,
          contactName: true,
          contactPhone: true,
          internalNotes: true,
          clientNotes: true,
          pdfUrl: true,
          sentAt: true,
          sentVia: true,
          acomptePercent: true,
          organizationId: true,
          client: {
            select: { name: true, phone: true },
          },
          event: {
            select: { name: true, status: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    const result: Commande[] = commandes.map((c) => ({
      id: c.id,
      organizationId: c.organizationId,
      clientId: c.clientId,
      eventId: c.eventId,
      number: c.number,
      status: c.status,
      eventType: c.eventType,
      eventDate: c.eventDate,
      guestCount: c.guestCount,
      location: c.location,
      menuId: c.menuId,
      menuName: c.menuName,
      pricePerPerson: c.pricePerPerson ? Number(c.pricePerPerson) : null,
      totalAmount: Number(c.totalAmount),
      acomptePercent: c.acomptePercent,
      acompteAmount: Number(c.acompteAmount),
      paidAmount: Number(c.paidAmount),
      remainingAmount: Number(c.remainingAmount),
      notes: c.notes,
      transportFees: c.transportFees ? Number(c.transportFees) : null,
      deliveryFees: c.deliveryFees ? Number(c.deliveryFees) : null,
      equipmentFees: c.equipmentFees ? Number(c.equipmentFees) : null,
      discountType: c.discountType,
      discountValue: c.discountValue ? Number(c.discountValue) : null,
      discountAmount: c.discountAmount ? Number(c.discountAmount) : null,
      clientBudget: c.clientBudget ? Number(c.clientBudget) : null,
      contactName: c.contactName,
      contactPhone: c.contactPhone,
      internalNotes: c.internalNotes,
      clientNotes: c.clientNotes,
      pdfUrl: c.pdfUrl,
      sentAt: c.sentAt,
      sentVia: c.sentVia,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      clientName: c.client?.name ?? null,
      clientPhone: c.client?.phone ?? null,
      eventName: c.event?.name ?? null,
      eventStatus: c.event?.status ?? null,
    }));

    const totalPages = Math.ceil(total / limit);

    return { success: true, data: { data: result, total, page, limit, totalPages } };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
}
