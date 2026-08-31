'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { createCommandeSchema } from '@/features/commandes/validations/create-commande-schema';
import { recalculateCommandeBalances } from '@/features/financial/recalculate-commande-balances';
import type { ActionResponse } from '@/features/commandes/types';
import { COMMANDE } from '@/lib/notify/messages';
import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';
import type { CommandeStatus, EventType, EventStatus, DiscountType } from '@prisma/client';

async function updateCommandeHandler(id: string, input: unknown): Promise<ActionResponse<void>> {
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

    // ── Verify foreign-key ownership (client-provided refs must belong to this org) ──
    const clientRef = await prisma.client.findFirst({
      where: { id: data.clientId, organizationId },
      select: { id: true },
    });
    if (!clientRef) {
      return { success: false, error: "Invalid client for organization" };
    }

    let resolvedEventId = existing.eventId;

    if (data.eventId) {
      // User explicitly selected an existing event — verify it belongs to this org.
      const eventRef = await prisma.event.findFirst({
        where: { id: data.eventId, organizationId },
        select: { id: true },
      });
      if (!eventRef) {
        return { success: false, error: "Invalid event for organization" };
      }
      resolvedEventId = data.eventId;
    }

    if (data.menuId) {
      const menuRef = await prisma.menu.findFirst({
        where: { id: data.menuId, organizationId },
        select: { id: true },
      });
      if (!menuRef) {
        return { success: false, error: "Invalid menu for organization" };
      }
    }

    // Line-item menuItem references must also belong to this organization.
    const menuItemIds = (data.items ?? [])
      .map((i) => i.menuItemId)
      .filter((id): id is string => Boolean(id));
    if (menuItemIds.length > 0) {
      const validMenuItems = await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds }, organizationId },
        select: { id: true },
      });
      if (validMenuItems.length !== menuItemIds.length) {
        return { success: false, error: "Invalid menu item for organization" };
      }
    }

    // ── Resolve eventId ──────────────────────────────────────────────
    // 1. If eventId was provided, it was already verified above.
    // 2. If no eventId but event data exists, create an Event and link it.
    // 3. If event data was cleared (no eventDate), leave eventId as null.

    if (resolvedEventId && data.eventDate) {
      // Update the linked Event with current form data (org-scoped by id + organizationId)
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
    return { success: false, error: normalizeActionError(error, COMMANDE.UPDATE.ERROR) };
  }
}

export const updateCommande = withActionGuard(updateCommandeHandler, { name: 'commandes:update' })
