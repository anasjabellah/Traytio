"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { assertCan } from "@/lib/assert-role"
import type { Prisma } from "@prisma/client"

export type PaymentWithCommande = {
  id: string
  amount: number
  method: string
  status: string
  reference: string | null
  notes: string | null
  createdAt: Date
  commande: {
    id: string
    number: string
    clientName: string | null
  }
}

export type PaymentStats = {
  totalCollected: number
  totalRefunded: number
  monthlyRevenue: number
  pendingCount: number
  previousMonthRevenue: number
}

type PaymentWithCommandeRaw = Prisma.PaymentGetPayload<{
  include: {
    commande: {
      select: {
        id: true
        number: true
        client: { select: { name: true } }
      }
    }
  }
}>

export async function getPayments(params?: {
  search?: string
  method?: string
  status?: string
}): Promise<{ data: PaymentWithCommande[]; stats: PaymentStats }> {
  const organizationId = await getOrganizationId()
  await assertCan('payments', 'read')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const where: Prisma.PaymentWhereInput = {
    organizationId,
  }

  if (params?.method) {
    where.method = params.method as Prisma.EnumPaymentMethodFilter["equals"]
  }

  if (params?.status) {
    where.status = params.status as Prisma.EnumPaymentStatusFilter["equals"]
  }

  if (params?.search) {
    where.OR = [
      { reference: { contains: params.search, mode: "insensitive" } },
      { notes: { contains: params.search, mode: "insensitive" } },
      { commande: { number: { contains: params.search, mode: "insensitive" } } },
    ]
  }

  const include = {
    commande: {
      select: {
        id: true,
        number: true,
        client: { select: { name: true } },
      },
    },
  } satisfies Prisma.PaymentInclude

  const [payments, collectedAgg, refundedAgg, monthlyAgg, previousMonthlyAgg, pendingCount] =
    await prisma.$transaction(async (tx) => {
      const p = await tx.payment.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
      })

      const collected = await tx.payment.aggregate({
        where: { organizationId, status: "COMPLETED" },
        _sum: { amount: true },
      })

      const refunded = await tx.payment.aggregate({
        where: { organizationId, status: "REFUNDED" },
        _sum: { amount: true },
      })

      const monthly = await tx.payment.aggregate({
        where: {
          organizationId,
          status: "COMPLETED",
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      })

      const previousMonthly = await tx.payment.aggregate({
        where: {
          organizationId,
          status: "COMPLETED",
          createdAt: {
            gte: startOfPreviousMonth,
            lt: startOfMonth,
          },
        },
        _sum: { amount: true },
      })

      const pending = await tx.payment.count({
        where: { organizationId, status: "PENDING" },
      })

      return [p, collected, refunded, monthly, previousMonthly, pending] as const
    })

  return {
    data: payments.map((p: PaymentWithCommandeRaw) => ({
      id: p.id,
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
      reference: p.reference,
      notes: p.notes,
      createdAt: p.createdAt,
      commande: {
        id: p.commande.id,
        number: p.commande.number,
        clientName: p.commande.client?.name ?? null,
      },
    })),
    stats: {
      totalCollected: Number(collectedAgg._sum.amount ?? 0),
      totalRefunded: Number(refundedAgg._sum.amount ?? 0),
      monthlyRevenue: Number(monthlyAgg._sum.amount ?? 0),
      pendingCount,
      previousMonthRevenue: Number(previousMonthlyAgg._sum.amount ?? 0),
    },
  }
}
