'use server';

import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
import { createCommandeSchema } from '@/features/commandes/validations/create-commande-schema';
import type { ActionResponse } from '@/features/commandes/types';
import type { CommandeStatus, EventType, DiscountType } from '@prisma/client';

export async function updateCommande(id: string, input: unknown): Promise<ActionResponse<void>> {
  try {
    const parsed = createCommandeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const organizationId = await getOrganizationId();
    const data = parsed.data;

    const existing = await prisma.commande.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return { success: false, error: 'Commande not found or access denied' };
    }

    await prisma.commande.update({
      where: { id },
      data: {
        clientId: data.clientId,
        status: data.status as CommandeStatus,
        eventType: (data.eventType ?? undefined) as EventType | undefined,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        guestCount: data.guestCount ?? undefined,
        location: data.location ?? undefined,
        menuId: data.menuId ?? undefined,
        menuName: data.menuName ?? undefined,
        pricePerPerson: data.pricePerPerson ?? undefined,
        totalAmount: data.totalAmount ?? 0,
        transportFees: data.transportFees ?? undefined,
        deliveryFees: data.deliveryFees ?? undefined,
        equipmentFees: data.equipmentFees ?? undefined,
        discountType: data.discountType as DiscountType | undefined,
        discountValue: data.discountValue ?? undefined,
        discountAmount: data.discountAmount ?? undefined,
        acomptePercent: data.acomptePercent ?? 0,
        acompteAmount: data.acompteAmount ?? 0,
        remainingAmount: data.remainingAmount ?? (data.totalAmount ?? 0),
        clientBudget: data.clientBudget ?? undefined,
        contactName: data.contactName ?? undefined,
        contactPhone: data.contactPhone ?? undefined,
        notes: data.notes ?? undefined,
        internalNotes: data.internalNotes ?? undefined,
        clientNotes: data.clientNotes ?? undefined,
        items: data.items && data.items.length > 0 ? {
          deleteMany: {},
          create: data.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            menuItemId: item.menuItemId ?? undefined,
            notes: item.notes ?? undefined,
          })),
        } : undefined,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update commande' };
  }
}
