"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { createCommandeSchema } from "@/features/commandes/validations/create-commande-schema"
import { recalculateCommandeBalances } from "@/features/financial/recalculate-commande-balances"
import type { CommandeStatus, EventType, EventStatus, DiscountType } from "@prisma/client";

export async function generateCommandeNumber(): Promise<string> {
  const organizationId = await getOrganizationId()
  const year = new Date().getFullYear()
  const count = await prisma.commande.count({
    where: { organizationId, createdAt: { gte: new Date(`${year}-01-01`) } },
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
    const organizationId = await getOrganizationId()

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
      ...commande,
      totalAmount: Number(commande.totalAmount),
      acompteAmount: Number(commande.acompteAmount),
      paidAmount: Number(commande.paidAmount),
      remainingAmount: Number(commande.remainingAmount),
      clientBudget: commande.clientBudget ? Number(commande.clientBudget) : null,
      discountAmount: commande.discountAmount ? Number(commande.discountAmount) : null,
      discountValue: commande.discountValue ? Number(commande.discountValue) : null,
      pricePerPerson: commande.pricePerPerson ? Number(commande.pricePerPerson) : null,
      transportFees: commande.transportFees ? Number(commande.transportFees) : null,
      deliveryFees: commande.deliveryFees ? Number(commande.deliveryFees) : null,
      equipmentFees: commande.equipmentFees ? Number(commande.equipmentFees) : null,
      items: (commande.items ?? []).map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    }

    return { success: true, data: serialized }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create commande" }
  }
}
