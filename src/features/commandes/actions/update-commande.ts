'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { createCommandeSchema } from '@/features/commandes/validations/create-commande-schema';
import { recalculateCommandeBalances, recalculateClientTotalSpent } from '@/features/financial/recalculate-commande-balances';
import type { ActionResponse } from '@/features/commandes/types';
import { COMMANDE } from '@/lib/notify/messages';
import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';
import type { CommandeStatus, EventType, EventStatus, DiscountType } from '@prisma/client';
import type { TaskInput } from '@/features/commandes/validations/create-commande-schema';

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

    // ── Resolve eventId ──────────────────────────────────────────
    // 1. If eventId was provided, it was already verified above.
    // 2. If no eventId but event data exists, an Event is created and linked
    //    INSIDE the transaction below (atomic with the Commande mutation).
    // 3. If event data was cleared (no eventDate), leave eventId as null.

    // ── HIGH-05: fetch persisted items BEFORE the transaction ──────
    // Persisted CommandeItem.unitPrice is the authoritative historical price.
    // On update we keep it for items that already exist (matched by
    // menuItemId, falling back to name for custom items) and recompute
    // totalPrice from the new quantity. Only genuinely new items — or items
    // whose price is genuinely absent — fall back to catalog/client prices.
    // The commande was already verified org-scoped above (existing), so its
    // items are tenant-safe by construction.
    const persistedItems = data.items === undefined
      ? []
      : await prisma.commandeItem.findMany({
          where: { commandeId: id },
          select: { menuItemId: true, name: true, unitPrice: true },
        });

    // Defensive catalog fallback, org-scoped: only queried when an incoming
    // item references a menuItemId but carries no valid unit price (the zod
    // schema normally requires one, so this is a safety net, not the path).
    const itemsNeedingCatalogPrice = (data.items ?? []).filter(
      (i) => i.menuItemId && !(typeof i.unitPrice === 'number' && Number.isFinite(i.unitPrice) && i.unitPrice >= 0),
    );
    const catalogPrices = new Map<string, number>();
    if (itemsNeedingCatalogPrice.length > 0) {
      const catalog = await prisma.menuItem.findMany({
        where: {
          id: { in: [...new Set(itemsNeedingCatalogPrice.map((i) => i.menuItemId!))] },
          organizationId,
        },
        select: { id: true, unitPrice: true },
      });
      for (const m of catalog) catalogPrices.set(m.id, Number(m.unitPrice));
    }

    // ── Update Commande and linked Event (atomic) ────────────────
    const oldClientId = existing.clientId;

    // Fetch original Event data before the transaction (needed for cloning).
    // Only needed if resolvedEventId exists and eventDate is being updated.
    const originalEvent = (resolvedEventId && data.eventDate)
      ? await prisma.event.findUnique({
          where: { id: resolvedEventId, organizationId },
          select: {
            id: true, organizationId: true, clientId: true,
            name: true, type: true, status: true, startDate: true,
            endDate: true, location: true, guestCount: true, budget: true,
            contactPerson: true, contactPhone: true, notes: true,
          },
        })
      : null;

    await prisma.$transaction(async (tx) => {
      // ── Clone-on-Write: if the Event is shared by multiple Commandes,
      //    create a clone instead of mutating the original.
      if (resolvedEventId && data.eventDate) {
        const commandesUsingEvent = await tx.commande.count({
          where: { eventId: resolvedEventId, organizationId },
        });

        if (commandesUsingEvent > 1) {
          // Event is shared — create a clone with the updated data.
          const clone = await tx.event.create({
            data: {
              organizationId,
              clientId: data.clientId,
              name: data.eventName ?? originalEvent!.name,
              type: (data.eventType ?? originalEvent!.type) as EventType,
              status: (data.eventStatus ?? originalEvent!.status) as EventStatus,
              startDate: data.eventDate ? new Date(data.eventDate) : originalEvent!.startDate,
              endDate: originalEvent!.endDate,
              location: data.location ?? originalEvent!.location,
              guestCount: data.guestCount ?? originalEvent!.guestCount,
              budget: data.clientBudget ?? originalEvent!.budget,
              contactPerson: data.contactName ?? originalEvent!.contactPerson,
              contactPhone: data.contactPhone ?? originalEvent!.contactPhone,
              notes: data.notes ?? originalEvent!.notes,
            },
          });
          // Reassign only the current Commande to the clone.
          resolvedEventId = clone.id;
        } else {
          // Not shared — update the existing Event in place.
          await tx.event.update({
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
        }
      }

      // If resolvedEventId exists but eventDate is empty, keep the existing
      // event link (don't null it out — the Event still exists).

      // Automatic Event creation is atomic with the Commande: it runs inside
      // this transaction so a failure cannot leave an orphan Event behind.
      let eventId = resolvedEventId
      if (!eventId && data.eventDate) {
        const startDate = new Date(data.eventDate);
        const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

        const createdEvent = await tx.event.create({
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
        eventId = createdEvent.id;
      }

      await tx.commande.update({
        where: { id, organizationId },
        data: {
          clientId: data.clientId,
          eventId,
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
          extraService: data.extraService ?? undefined,
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
          // Three-state items semantics:
          //   undefined (omitted)  → no item update
          //   []                   → explicitly clear all existing line items
          //   non-empty            → replace items (delete + recreate)
          items: data.items === undefined
            ? undefined
            : {
                deleteMany: {},
                create: data.items.map((item) => {
                  // HIGH-05: persisted price wins for existing rows so a later
                  // MenuItem price change can never rewrite history. totalPrice
                  // is recomputed from the (possibly new) quantity with the
                  // same quantity × unitPrice formula as the client.
                  const persisted = persistedItems.find((p) =>
                    item.menuItemId
                      ? p.menuItemId === item.menuItemId
                      : p.menuItemId == null && p.name === item.name,
                  );
                  const hasClientPrice =
                    typeof item.unitPrice === 'number' &&
                    Number.isFinite(item.unitPrice) &&
                    item.unitPrice >= 0;
                  const unitPrice = persisted
                    ? Number(persisted.unitPrice)
                    : hasClientPrice
                      ? item.unitPrice
                      : (item.menuItemId ? catalogPrices.get(item.menuItemId) : undefined)
                        ?? item.unitPrice;
                  return {
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice,
                    // Persisted rows: recompute from the new quantity with the
                    // same quantity × unitPrice formula. New rows: keep the
                    // caller-supplied total untouched.
                    totalPrice: persisted ? unitPrice * item.quantity : item.totalPrice,
                    menuItemId: item.menuItemId ?? undefined,
                    notes: item.notes ?? undefined,
                  };
                }),
              },
        },
      });

      await recalculateCommandeBalances(tx, id);

      if (data.tasks) {
        await tx.commandeTask.deleteMany({ where: { commandeId: id } });
        for (const t of data.tasks) {
          await tx.commandeTask.create({
            data: { commandeId: id, title: t.label, isDone: t.done ?? false },
          });
        }
      }

      if (oldClientId && oldClientId !== data.clientId) {
        await recalculateClientTotalSpent(tx, oldClientId);
      }
    });

    revalidatePath("/dashboard/commandes")
    revalidatePath("/dashboard")

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, COMMANDE.UPDATE.ERROR) };
  }
}

export const updateCommande = withActionGuard(updateCommandeHandler, { name: 'commandes:update' })
