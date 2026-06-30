"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { createCommandeSchema } from "@/features/commandes/validations/create-commande-schema"
import { recalculateCommandeBalances } from "@/features/financial/recalculate-commande-balances"
import { serializeCommande, serializeCommandeItem } from "@/features/commandes/lib/serialize-commande"
import type { CommandeStatus, EventType, EventStatus, DiscountType } from "@prisma/client";

export async function generateCommandeNumber(): Promise<string> {
  const membership = await getCurrentMembership()
  const year = new Date().getFullYear()
  const count = await prisma.commande.count({
    where: { organizationId: membership.organizationId, createdAt: { gte: new Date(`${year}-01-01`) } },
  })
  return `CMD-${year}-${String(count + 1).padStart(3, "0")}`
}

export async function createCommande(input: unknown) {
  try {
    const parsed = createCommandeSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
    }

    const data = parsed.data
    const membership = await getCurrentMembership()
    await assertCan('commandes', 'create')
    const organizationId = membership.organizationId

    // ── Resolve eventId ──────────────────────────────────────────────
    // If eventId was provided (user selected an existing event), use it.
    // Otherwise, auto-create an Event record from the denormalized data.
    let resolvedEventId = data.eventId ?? null;

    if (!resolvedEventId && data.eventDate) {
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

    // ── Create Commande with eventId and snapshot ────────────────────
    const commande = await prisma.$transaction(async (tx) => {
      const cmd = await tx.commande.create({
        data: {
          organizationId,
          createdById: membership.userId,
          clientId: data.clientId,
          number: data.number,
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
          items: {
            create: (data.items ?? []).map(item => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              menuItemId: item.menuItemId ?? undefined,
              notes: item.notes ?? undefined,
            })),
          },
        },
        include: { items: true, tasks: true },
      })

      await recalculateCommandeBalances(tx, cmd.id)
      return cmd
    })

    const serialized = {
      ...serializeCommande(commande as Parameters<typeof serializeCommande>[0]),
      items: (commande.items ?? []).map(serializeCommandeItem),
    }

    revalidatePath("/dashboard/commandes")
    revalidatePath("/dashboard")

    return { success: true, data: serialized }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create commande" }
  }
}
