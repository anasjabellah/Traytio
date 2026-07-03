"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { createCommandeSchema } from "@/features/commandes/validations/create-commande-schema"
import { recalculateCommandeBalances } from "@/features/financial/recalculate-commande-balances"
import { serializeCommande, serializeCommandeItem } from "@/features/commandes/lib/serialize-commande"
import type { CommandeStatus, EventType, EventStatus, DiscountType } from "@prisma/client";

function isPrismaP2002(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002'
}

const MAX_NUMBER_RETRIES = 5

async function nextCommandeNumber(tx: any, organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const result: Array<{ last_number: bigint }> = await tx.$queryRaw`
    INSERT INTO "commande_number_counters" ("organizationId", "year", "lastNumber")
    VALUES (${organizationId}, ${year}, 1)
    ON CONFLICT ("organizationId", "year")
    DO UPDATE SET "lastNumber" = "commande_number_counters"."lastNumber" + 1
    RETURNING "lastNumber" AS last_number
  `
  const seqNumber = Number(result[0].last_number)
  return `CMD-${year}-${String(seqNumber).padStart(4, "0")}`
}

export async function createCommande(input: unknown) {
  const parsed = createCommandeSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const data = parsed.data
  const membership = await getCurrentMembership()
  await assertCan('commandes', 'create')
  const organizationId = membership.organizationId

  // ── Resolve eventId ──────────────────────────────────────────────
  let resolvedEventId = data.eventId ?? null;

  if (!resolvedEventId && data.eventDate) {
    const startDate = new Date(data.eventDate);
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

    const createdEvent = await prisma.event.create({
      data: {
        organizationId,
        clientId: data.clientId,
        name: data.eventName ?? `Événement - ${data.number ?? 'Nouveau'}`,
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

  // ── Create Commande with P2002 retry for number uniqueness ────────
  let lastError: unknown = null
  for (let attempt = 0; attempt < MAX_NUMBER_RETRIES; attempt++) {
    try {
      const commande = await prisma.$transaction(async (tx) => {
        const number = data.number ?? await nextCommandeNumber(tx, organizationId)

        const cmd = await tx.commande.create({
          data: {
            organizationId,
            createdById: membership.userId,
            clientId: data.clientId,
            number,
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
      lastError = err
      // Prisma P2002 = unique constraint violation → retry with new number
      if (isPrismaP2002(err) && !data.number) {
        continue
      }
      return { success: false, error: err instanceof Error ? err.message : "Failed to create commande" }
    }
  }

  return { success: false, error: lastError instanceof Error ? lastError.message : "Failed to create commande after multiple attempts" }
}
