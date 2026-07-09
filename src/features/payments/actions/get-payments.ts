"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { assertCan } from "@/lib/assert-role"
import { PAYMENT } from "@/lib/notify/messages"
import { PAYMENT_DEFAULT_PAGE_SIZE } from "@/features/payments/constants"
import type { ActionResponse, PaginatedPayments, PaymentWithCommande, PaymentStats } from "@/features/payments/types"
import type { Prisma } from "@prisma/client"

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
  page?: number
  limit?: number
}): Promise<ActionResponse<PaginatedPayments>> {
  try {
    const organizationId = await getOrganizationId()
    await assertCan('payments', 'read')

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const page = params?.page ?? 1
    const limit = params?.limit ?? PAYMENT_DEFAULT_PAGE_SIZE
    const skip = (page - 1) * limit

    const where: Prisma.PaymentWhereInput = { organizationId }

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

    const [items, total, collectedAgg, refundedAgg, monthlyAgg, previousMonthlyAgg, pendingCount] =
      await prisma.$transaction(async (tx) => {
        const p = await tx.payment.findMany({
          where,
          include,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        })

        const total = await tx.payment.count({ where })

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

        return [p, total, collected, refunded, monthly, previousMonthly, pending] as const
      })

    const data: PaymentWithCommande[] = items.map((p: PaymentWithCommandeRaw) => ({
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
    }))

    const stats: PaymentStats = {
      totalCollected: Number(collectedAgg._sum.amount ?? 0),
      totalRefunded: Number(refundedAgg._sum.amount ?? 0),
      monthlyRevenue: Number(monthlyAgg._sum.amount ?? 0),
      pendingCount,
      previousMonthRevenue: Number(previousMonthlyAgg._sum.amount ?? 0),
    }

    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: { data, stats, total, page, limit, totalPages },
    }
  } catch (e: any) {
    return { success: false, error: e.message || PAYMENT.FETCH_ERROR }
  }
}
