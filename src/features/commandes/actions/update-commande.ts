'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { createCommandeSchema } from '@/features/commandes/validations/create-commande-schema';
import { recalculateCommandeBalances } from '@/features/financial/recalculate-commande-balances';
import type { ActionResponse } from '@/features/commandes/types';
import { COMMANDE } from '@/lib/notify/messages';
import type { CommandeStatus, EventType, EventStatus, DiscountType } from '@prisma/client';

export async function updateCommande(id: string, input: unknown): Promise<ActionResponse<void>> {
  try {
    const parsed = createCommandeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? COMMANDE.VALIDATION.INVALID_INPUT };
    }

    const organizationId = await getOrganizationId();
    const data = parsed.data;

    const existing = await prisma.commande.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return { success: false, error: COMMANDE.NOT_FOUND_OR_ACCESS_DENIED };
    }

    await assertCan('commandes', 'update', existing.createdById ?? undefined);

    // ── Resolve eventId ──────────────────────────────────────────────
    // 1. If eventId was provided, update the linked Event with new data.
    // 2. If no eventId but event data exists, create an Event and link it.
    // 3. If event data was cleared (no eventDate), leave eventId as null.

    let resolvedEventId = existing.eventId;

    if (data.eventId) {
      // User explicitly selected an existing event — link to it
      resolvedEventId = data.eventId;
    }

    if (resolvedEventId && data.eventDate) {
      // Update the linked Event with current form data
      // Verify the event belongs to this organization before updating
      const targetEvent = await prisma.event.findFirst({
        where: { id: resolvedEventId, organizationId },
        select: { id: true },
      });
      if (!targetEvent) {
        return { success: false, error: COMMANDE.EVENT_NOT_FOUND };
      }

      await prisma.event.update({
        where: { id: resolvedEventId, organizationId },
        data: {
          name: data.eventName ?? undefined,
          type: (data.eventType ?? undefined) as EventType | undefined,
          status: (data.eventStatus ?? undefined) as EventStatus | undefined,
          startDate: data.eventDate ? new Date(data.eventDate) : undefined,
          location: data.location ?? undefined,
          guestCount: data.guestCount ?? undefined,
          budget: data.clientBudget ?? undefined,
          contactPerson: data.contactName ?? undefined,
          contactPhone: data.contactPhone ?? undefined,
          notes: data.notes ?? undefined,
        },
      });
    } else if (!resolvedEventId && data.eventDate) {
      // No existing event but event data present — create one
      const startDate = new Date(data.eventDate);
      const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

      const createdEvent = await prisma.event.create({
        data: {
          organizationId,
          clientId: data.clientId,
          name: data.eventName ?? `Événement - ${data.number}`,
          type: (data.eventType ?? 'OTHER') as EventType,
          status: (data.eventStatus ?? 'CONFIRMED') as EventStatus,
          startDate,
          endDate,
          location: data.location ?? undefined,
          guestCount: data.guestCount ?? undefined,
          budget: data.clientBudget ?? undefined,
          contactPerson: data.contactName ?? undefined,
          contactPhone: data.contactPhone ?? undefined,
          notes: data.notes ?? undefined,
        },
      });
      resolvedEventId = createdEvent.id;
    }
    // If resolvedEventId exists but eventDate is empty, keep the existing
    // event link (don't null it out — the Event still exists).

    // ── Update Commande ──────────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      await tx.commande.update({
        where: { id },
        data: {
          clientId: data.clientId,
          eventId: resolvedEventId,
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

      await recalculateCommandeBalances(tx, id);
    });

    revalidatePath("/dashboard/commandes")
    revalidatePath("/dashboard")

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : COMMANDE.UPDATE.ERROR };
  }
}
