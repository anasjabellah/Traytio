"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { assertCan } from "@/lib/assert-role"
import { withActionGuard } from "@/lib/action-guard"
import { PAYMENT } from "@/lib/notify/messages"
import { recalculateCommandeBalances } from "@/features/financial/recalculate-commande-balances"
import { recordPaymentSchema } from "@/features/payments/validations/payment-schemas"
import type { PaymentMethod, CommandePaymentStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

async function recordPaymentHandler(input: unknown) {
  try {
    const parsed = recordPaymentSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.issues[0]?.message ?? PAYMENT.VALIDATION.INVALID_DATA }
    }

    const data = parsed.data
    const organizationId = await getOrganizationId()
    await assertCan('payments', 'create')

    // Verify commande exists and belongs to organization before transaction
    const commande = await prisma.commande.findFirst({
      where: { id: data.commandeId, organizationId },
      select: { id: true },
    })

    if (!commande) {
      return { success: false as const, error: PAYMENT.NOT_FOUND_COMMANDE }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Fresh read inside transaction to minimize race window
      const freshCommande = await tx.commande.findUnique({
        where: { id: data.commandeId },
        select: { remainingAmount: true },
      })

      if (!freshCommande) {
        return { success: false as const, error: PAYMENT.NOT_FOUND_COMMANDE_ALT }
      }

      const remaining = Number(freshCommande.remainingAmount)
      if (data.amount > remaining) {
        return {
          success: false as const,
          error: PAYMENT.VALIDATION.AMOUNT_EXCEEDS_BALANCE(
            data.amount.toLocaleString("fr-FR"),
            remaining.toLocaleString("fr-FR"),
          ),
        }
      }

      const payment = await tx.payment.create({
        data: {
          organizationId,
          commandeId: data.commandeId,
          amount: data.amount,
          method: data.method as PaymentMethod,
          status: "COMPLETED",
          reference: data.reference ?? undefined,
          notes: data.notes ?? undefined,
          createdAt: new Date(data.date),
        },
      })

      await recalculateCommandeBalances(tx, data.commandeId)

      await tx.commandeActivity.create({
        data: {
          commandeId: data.commandeId,
          action: PAYMENT.ACTIVITY.CREATE.ACTION,
          description: PAYMENT.ACTIVITY.CREATE.DESCRIPTION(
            data.amount.toLocaleString("fr-FR"),
            data.method,
            data.reference ?? null,
          ),
        },
      })

      return { success: true as const, payment }
    })

    if (!result.success) {
      return result
    }

    // Re-fetch updated values
    const updated = await prisma.commande.findFirst({
      where: { id: data.commandeId, organizationId },
      select: {
        paidAmount: true,
        remainingAmount: true,
        paymentStatus: true,
      },
    })

    revalidatePath("/dashboard/commandes")
    revalidatePath("/dashboard")

    return {
      success: true as const,
      payment: {
        ...result.payment,
        amount: Number(result.payment.amount),
      },
      paidAmount: Number(updated?.paidAmount ?? 0),
      remainingAmount: Number(updated?.remainingAmount ?? 0),
      paymentStatus: updated?.paymentStatus as CommandePaymentStatus,
    }
  } catch (err: unknown) {
    return { success: false as const, error: err instanceof Error ? err.message : PAYMENT.CREATE.ERROR }
  }
}

export const recordPayment = withActionGuard(recordPaymentHandler, { name: 'payments:create' })
