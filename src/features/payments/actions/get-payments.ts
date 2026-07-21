"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { assertCan } from "@/lib/assert-role"
import { withActionGuard } from "@/lib/action-guard"
import { PAYMENT } from "@/lib/notify/messages"
import { normalizeActionError } from "@/lib/action-error"
import { PAYMENT_DEFAULT_PAGE_SIZE } from "@/features/payments/constants"
import type { ActionResponse, PaginatedPayments, PaymentWithCommande, PaymentStats } from "@/features/payments/types"
import type { Prisma } from "@prisma/client"
import { buildMonthlySparkline, buildMonthKeys } from "@/features/dashboard/lib/kpi-engine"

const getPaymentsSchema = z.object({
  search: z.string().max(100).optional(),
  method: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

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

async function getPaymentsHandler(params?: {
  search?: string
  method?: string
  status?: string
  page?: number
  limit?: number
}): Promise<ActionResponse<PaginatedPayments>> {
  try {
    getPaymentsSchema.parse(params ?? {});
    const organizationId = await getOrganizationId()
    await assertCan('payments', 'read')

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const monthKeys = buildMonthKeys(8)
    const [firstYear, firstMonth] = monthKeys[0].split('-').map(Number)
    const historicalStart = new Date(firstYear, firstMonth - 1, 1)

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

    // NOTE: all-time collected/refunded and pendingCount come from a single groupBy.
    // Monthly aggregates (this month, previous month) are derived from the 8-month
    // historical fetch in JS. This reduces the original 8 sequential queries to 4
    // parallel queries, eliminating ~4 round-trips (~200ms at current RTT).
    const [items, total, statusAgg, historicalRows] = await Promise.all([
      prisma.payment.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
      prisma.payment.groupBy({
        by: ['status'],
        where: { organizationId, status: { in: ["COMPLETED", "REFUNDED", "PENDING"] } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.findMany({
        where: { organizationId, createdAt: { gte: historicalStart } },
        select: { createdAt: true, amount: true, status: true },
      }),
    ])

    const collectedAgg = statusAgg.find(g => g.status === "COMPLETED")
    const refundedAgg = statusAgg.find(g => g.status === "REFUNDED")
    const pendingGroup = statusAgg.find(g => g.status === "PENDING")
    const pendingCount = pendingGroup?._count ?? 0

    const monthlyRevenue = historicalRows
      .filter(r => r.status === "COMPLETED" && r.createdAt >= startOfMonth)
      .reduce((s, r) => s + Number(r.amount), 0)
    const previousMonthRevenue = historicalRows
      .filter(r => r.status === "COMPLETED" && r.createdAt >= startOfPreviousMonth && r.createdAt < startOfMonth)
      .reduce((s, r) => s + Number(r.amount), 0)

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

    const perfCollected = buildMonthlySparkline(
      historicalRows.filter(r => r.status === "COMPLETED"),
      monthKeys,
      r => Number(r.amount),
    )

    const perfRevenue = buildMonthlySparkline(
      historicalRows.filter(r => r.status === "COMPLETED"),
      monthKeys,
      r => Number(r.amount),
    )

    const perfRefunded = buildMonthlySparkline(
      historicalRows.filter(r => r.status === "REFUNDED"),
      monthKeys,
      r => Number(r.amount),
    )

    const perfPending = buildMonthlySparkline(
      historicalRows.filter(r => r.status === "PENDING"),
      monthKeys,
    )

    const stats: PaymentStats = {
      totalCollected: Number(collectedAgg?._sum.amount ?? 0),
      totalRefunded: Number(refundedAgg?._sum.amount ?? 0),
      monthlyRevenue,
      pendingCount,
      previousMonthRevenue,
      perfCollected,
      perfRevenue,
      perfRefunded,
      perfPending,
    }

    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: { data, stats, total, page, limit, totalPages },
    }
  } catch (e: any) {
    return { success: false, error: normalizeActionError(e, PAYMENT.FETCH_ERROR) }
  }
}

export const getPayments = withActionGuard(getPaymentsHandler, { name: 'payments:read' })
