"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { recalculateCommandeBalances } from "@/features/financial/recalculate-commande-balances"
import { recordPaymentSchema } from "@/features/payments/validations/payment-schemas"
import type { PaymentMethod, CommandePaymentStatus } from "@prisma/client"

export async function recordPayment(input: unknown) {
  try {
    const parsed = recordPaymentSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
    }

    const data = parsed.data
    const organizationId = await getOrganizationId()

    const commande = await prisma.commande.findFirst({
      where: { id: data.commandeId, organizationId },
      select: {
        id: true,
        totalAmount: true,
        remainingAmount: true,
        number: true,
      },
    })

    if (!commande) {
      return { success: false as const, error: "Commande introuvable ou accès refusé" }
    }

    const remaining = Number(commande.remainingAmount)
    if (data.amount > remaining) {
      return {
        success: false as const,
        error: `Le montant (${data.amount.toLocaleString("fr-FR")} MAD) dépasse le solde restant (${remaining.toLocaleString("fr-FR")} MAD)`,
      }
    }

    const result = await prisma.$transaction(async (tx) => {
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
          action: "Paiement enregistré",
          description: `Montant: ${data.amount.toLocaleString("fr-FR")} MAD | Méthode: ${data.method}${data.reference ? ` | Réf: ${data.reference}` : ""}`,
        },
      })

      return { payment }
    })

    const updated = await prisma.commande.findFirst({
      where: { id: data.commandeId, organizationId },
      select: {
        paidAmount: true,
        remainingAmount: true,
        paymentStatus: true,
      },
    })

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
    return { success: false as const, error: err instanceof Error ? err.message : "Erreur lors de l'enregistrement du paiement" }
  }
}
