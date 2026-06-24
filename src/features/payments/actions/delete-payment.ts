"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { assertCan } from "@/lib/assert-role"
import { recalculateCommandeBalances } from "@/features/financial/recalculate-commande-balances"
import type { CommandePaymentStatus } from "@prisma/client"

export async function deletePayment(paymentId: string) {
  try {
    if (!paymentId || typeof paymentId !== "string") {
      return { success: false as const, error: "ID de paiement invalide" }
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
      return { success: false as const, error: "Paiement introuvable ou accès refusé" }
    }

    const commande = await prisma.commande.findFirst({
      where: { id: payment.commandeId, organizationId },
      select: { id: true, number: true },
    })

    if (!commande) {
      return { success: false as const, error: "Commande liée introuvable" }
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: { id: paymentId },
      })

      await recalculateCommandeBalances(tx, payment.commandeId)

      await tx.commandeActivity.create({
        data: {
          commandeId: payment.commandeId,
          action: "Paiement supprimé",
          description: `Montant: ${Number(payment.amount).toLocaleString("fr-FR")} MAD | Méthode: ${payment.method}${payment.reference ? ` | Réf: ${payment.reference}` : ""}`,
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
    return { success: false as const, error: err instanceof Error ? err.message : "Erreur lors de la suppression du paiement" }
  }
}
