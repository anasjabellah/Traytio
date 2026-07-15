"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { assertCan } from "@/lib/assert-role"
import { PAYMENT } from "@/lib/notify/messages"
import { recalculateCommandeBalances } from "@/features/financial/recalculate-commande-balances"
import type { CommandePaymentStatus } from "@prisma/client"

const deletePaymentSchema = z.object({
  paymentId: z.string().min(1),
})

export async function deletePayment(paymentId: string) {
  try {
    const parsed = deletePaymentSchema.safeParse({ paymentId })
    if (!parsed.success) {
      return { success: false as const, error: PAYMENT.INVALID_ID }
    }

    const organizationId = await getOrganizationId()
    await assertCan('payments', 'delete')

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, organizationId },
      select: {
        id: true,
        commandeId: true,
        amount: true,
        method: true,
        reference: true,
      },
    })

    if (!payment) {
      return { success: false as const, error: PAYMENT.NOT_FOUND }
    }

    const commande = await prisma.commande.findFirst({
      where: { id: payment.commandeId, organizationId },
      select: { id: true, number: true },
    })

    if (!commande) {
      return { success: false as const, error: PAYMENT.NOT_FOUND_COMMANDE_LINKED }
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: { id: paymentId },
      })

      await recalculateCommandeBalances(tx, payment.commandeId)

      await tx.commandeActivity.create({
        data: {
          commandeId: payment.commandeId,
          action: PAYMENT.ACTIVITY.DELETE.ACTION,
          description: PAYMENT.ACTIVITY.DELETE.DESCRIPTION(
            Number(payment.amount).toLocaleString("fr-FR"),
            payment.method,
            payment.reference,
          ),
        },
      })
    })

    const updated = await prisma.commande.findFirst({
      where: { id: payment.commandeId, organizationId },
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
      paidAmount: Number(updated?.paidAmount ?? 0),
      remainingAmount: Number(updated?.remainingAmount ?? 0),
      paymentStatus: updated?.paymentStatus as CommandePaymentStatus,
    }
  } catch (err: unknown) {
    return { success: false as const, error: err instanceof Error ? err.message : PAYMENT.DELETE.ERROR }
  }
}
