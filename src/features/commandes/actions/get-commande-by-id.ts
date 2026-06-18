'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, CommandeWithDetails } from '@/features/commandes/types';
import { getOrganizationId } from '@/lib/get-organization-id';

export async function getCommandeById(id: string): Promise<ActionResponse<CommandeWithDetails>> {
  try {
    const organizationId = await getOrganizationId();
    console.log("getCommandeById — id:", id, "organizationId:", organizationId);

    const commande = await prisma.commande.findFirst({
      where: { id, organizationId },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        event: {
          select: {
            id: true, name: true, type: true, startDate: true, endDate: true,
            guestCount: true, location: true, budget: true,
            contactPerson: true, contactPhone: true, notes: true,
          },
        },
        menu: {
          select: { id: true, name: true },
        },
        items: true,
        tasks: true,
        attachments: true,
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!commande) {
      console.log("getCommandeById — commande not found for id:", id, "organizationId:", organizationId);
      return { success: false, error: 'Commande not found' };
    }

    const result: CommandeWithDetails = {
      ...commande,
      totalAmount: Number(commande.totalAmount),
      acompteAmount: Number(commande.acompteAmount),
      paidAmount: Number(commande.paidAmount),
      remainingAmount: Number(commande.remainingAmount),
      pricePerPerson: commande.pricePerPerson ? Number(commande.pricePerPerson) : null,
      transportFees: commande.transportFees ? Number(commande.transportFees) : null,
      deliveryFees: commande.deliveryFees ? Number(commande.deliveryFees) : null,
      equipmentFees: commande.equipmentFees ? Number(commande.equipmentFees) : null,
      discountValue: commande.discountValue ? Number(commande.discountValue) : null,
      discountAmount: commande.discountAmount ? Number(commande.discountAmount) : null,
      clientBudget: commande.clientBudget ? Number(commande.clientBudget) : null,
      clientName: commande.client?.name ?? null,
      clientPhone: commande.client?.phone ?? null,
      eventName: commande.event?.name ?? null,
      event: commande.event ? {
        ...commande.event,
        budget: commande.event.budget ? Number(commande.event.budget) : null,
      } : null,
      items: commande.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
    };

    return { success: true, data: result };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
}
