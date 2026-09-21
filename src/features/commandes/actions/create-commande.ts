"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { createCommandeSchema } from "@/features/commandes/validations/create-commande-schema"
import { recalculateCommandeBalances } from "@/features/financial/recalculate-commande-balances"
import { serializeCommande, serializeCommandeItem } from "@/features/commandes/lib/serialize-commande"
import { COMMANDE, NOTIFICATION } from "@/lib/notify/messages"
import { withActionGuard } from "@/lib/action-guard"
import { normalizeActionError } from "@/lib/action-error"
import { notifyOrganizationMembers } from "@/features/notifications/lib/notify"
import type { CommandeStatus, EventType, EventStatus, DiscountType, Prisma } from "@prisma/client";
import type { TaskInput } from "@/features/commandes/validations/create-commande-schema";

function isPrismaP2002(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002'
}

const MAX_NUMBER_RETRIES = 5

async function nextCommandeNumber(tx: Prisma.TransactionClient, organizationId: string): Promise<string> {
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

async function createCommandeHandler(input: unknown) {
  const parsed = createCommandeSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? COMMANDE.VALIDATION.INVALID_INPUT }
  }

  const data = parsed.data
  const membership = await getCurrentMembership()
  await assertCan('commandes', 'create')
  const organizationId = membership.organizationId

  // ── Verify foreign-key ownership (client-provided refs must belong to this org) ──
  const [clientRef, eventRef, menuRef] = await Promise.all([
    prisma.client.findFirst({ where: { id: data.clientId, organizationId }, select: { id: true } }),
    data.eventId
      ? prisma.event.findFirst({ where: { id: data.eventId, organizationId }, select: { id: true } })
      : Promise.resolve(null),
    data.menuId
      ? prisma.menu.findFirst({ where: { id: data.menuId, organizationId }, select: { id: true } })
      : Promise.resolve(null),
  ]);
  if (!clientRef) return { success: false, error: "Invalid client for organization" };
  if (data.eventId && !eventRef) return { success: false, error: "Invalid event for organization" };
  if (data.menuId && !menuRef) return { success: false, error: "Invalid menu for organization" };

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

  // ── HIGH-05: catalog fallback map for genuinely-missing item prices ──
  // The zod schema requires unitPrice, so this only triggers for callers
  // that bypass validation. Org-scoped like the menuItem check above.
  const catalogPrices = new Map<string, number>();
  {
    const ids = [...new Set(
      (parsed.data.items ?? [])
        .filter((i) => i.menuItemId && !(typeof i.unitPrice === 'number' && Number.isFinite(i.unitPrice) && i.unitPrice >= 0))
        .map((i) => i.menuItemId!),
    )];
    if (ids.length > 0) {
      const catalog = await prisma.menuItem.findMany({
        where: { id: { in: ids }, organizationId },
        select: { id: true, unitPrice: true },
      });
      for (const m of catalog) catalogPrices.set(m.id, Number(m.unitPrice));
    }
  }

  // ── Resolve eventId ──────────────────────────────────────────────
  // A client-provided eventId is resolved here (validated above). The
  // automatic Event creation lives INSIDE the transaction below so a
  // rollback or P2002 retry can never leave an orphan/duplicate Event.
  const resolvedEventId = data.eventId ?? null;

  // ── Create Commande with P2002 retry for number uniqueness ────────
  let lastError: unknown = null
  for (let attempt = 0; attempt < MAX_NUMBER_RETRIES; attempt++) {
    try {
      const commande = await prisma.$transaction(async (tx) => {
        const number = data.number ?? await nextCommandeNumber(tx, organizationId)

        // Automatic Event creation is atomic with the Commande: it runs inside
        // this transaction (per attempt), so a rollback or retry never leaves
        // an orphan or duplicate Event behind. A resolved client eventId skips it.
        let eventId = resolvedEventId
        if (!eventId && data.eventDate) {
          const startDate = new Date(data.eventDate)
          const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000)

          const createdEvent = await tx.event.create({
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
          })
          eventId = createdEvent.id
        }

        const cmd = await tx.commande.create({
          data: {
            organizationId,
            createdById: membership.userId,
            clientId: data.clientId,
            number,
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
            items: {
              create: (data.items ?? []).map(item => {
                const hasClientPrice =
                  typeof item.unitPrice === 'number' &&
                  Number.isFinite(item.unitPrice) &&
                  item.unitPrice >= 0;
                // HIGH-05: at creation the client (catalog) price is the
                // historical price; the catalog lookup below only fires when
                // the price is genuinely absent.
                const unitPrice = hasClientPrice
                  ? item.unitPrice
                  : (item.menuItemId ? catalogPrices.get(item.menuItemId) : undefined)
                    ?? item.unitPrice;
                return {
                  name: item.name,
                  quantity: item.quantity,
                  unitPrice,
                  // Recompute only when we fell back to a different price;
                  // otherwise keep the caller-supplied total untouched.
                  totalPrice: hasClientPrice ? item.totalPrice : unitPrice * item.quantity,
                  menuItemId: item.menuItemId ?? undefined,
                  notes: item.notes ?? undefined,
                };
              }),
            },
          },
          include: { items: true, tasks: true },
        })

        await recalculateCommandeBalances(tx, cmd.id)

        if (data.tasks && data.tasks.length > 0) {
          for (const t of data.tasks) {
            await tx.commandeTask.create({
              data: { commandeId: cmd.id, title: t.label, isDone: t.done ?? false },
            })
          }
        }

        return cmd
      })

      const serialized = {
        ...serializeCommande(commande as Parameters<typeof serializeCommande>[0]),
        items: (commande.items ?? []).map(serializeCommandeItem),
      }

      revalidatePath("/dashboard/commandes")
      revalidatePath("/dashboard")

      // Best-effort team notification — must never fail the creation.
      try {
        await notifyOrganizationMembers(prisma, organizationId, {
          type: 'COMMANDE_CREATED',
          title: NOTIFICATION.CREATE.COMMANDE_CREATED_TITLE,
          message: `La commande ${serialized.number} a été créée.`,
          href: `/dashboard/commandes/${serialized.id}`,
        })
      } catch {
        // Intentionally swallowed: notification fan-out is non-critical.
      }

      return { success: true, data: serialized }
    } catch (err: unknown) {
      lastError = err
      // Prisma P2002 = unique constraint violation → retry with new number
      if (isPrismaP2002(err) && !data.number) {
        continue
      }
      return { success: false, error: normalizeActionError(err, COMMANDE.CREATE.ERROR) }
    }
  }

  return { success: false, error: normalizeActionError(lastError, COMMANDE.CREATE.ERROR_RETRIES) }
}

export const createCommande = withActionGuard(createCommandeHandler, { name: 'commandes:create' })
