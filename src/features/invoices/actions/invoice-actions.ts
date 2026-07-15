"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { assertCan } from "@/lib/assert-role"
import { withActionGuard } from "@/lib/action-guard"
import { updateInvoiceStatusSchema } from "@/features/invoices/validations/invoice-schemas"
import { INVOICE } from "@/lib/notify/messages"
import type { ActionResponse, Invoice, InvoiceWithCommande } from "@/features/invoices/types"

const commandeIdSchema = z.object({
  commandeId: z.string().min(1),
})

const quoteIdSchema = z.object({
  quoteId: z.string().min(1),
})

const getInvoiceByIdSchema = z.object({
  id: z.string().min(1),
})

const getInvoicesSchema = z.object({
  commandeId: z.string().optional(),
  type: z.enum(["DEVIS", "FACTURE"]).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

function isPrismaP2002(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002'
}

const MAX_NUMBER_RETRIES = 5

const INVOICE_PREFIX: Record<string, string> = { DEVIS: "DEV", FACTURE: "FAC" }

async function nextInvoiceNumber(organizationId: string, type: "DEVIS" | "FACTURE"): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = INVOICE_PREFIX[type]
  const result: Array<{ last_number: bigint }> = await prisma.$queryRaw`
    INSERT INTO "invoice_number_counters" ("organizationId", "year", "type", "lastNumber")
    VALUES (${organizationId}, ${year}, ${type}, 1)
    ON CONFLICT ("organizationId", "year", "type")
    DO UPDATE SET "lastNumber" = "invoice_number_counters"."lastNumber" + 1
    RETURNING "lastNumber" AS last_number
  `
  const seqNumber = Number(result[0].last_number)
  return `${prefix}-${year}-${String(seqNumber).padStart(4, "0")}`
}

async function createQuoteFromCommandeHandler(commandeId: string): Promise<ActionResponse<InvoiceWithCommande>> {
  const parsed = commandeIdSchema.safeParse({ commandeId })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? INVOICE.INVALID_STATUS }
  }

  const organizationId = await getOrganizationId()
  await assertCan('invoices', 'create')

  const commande = await prisma.commande.findFirst({
    where: { id: parsed.data.commandeId, organizationId },
    include: {
      client: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, company: true, siret: true } },
      event: { select: { name: true, startDate: true, location: true } },
      items: true,
    },
  })

  if (!commande) {
    return { success: false, error: INVOICE.NOT_FOUND_COMMANDE }
  }

  // nextInvoiceNumber runs outside the transaction via prisma.$queryRaw
  // (autocommit), so the counter increment survives any transaction rollback.
  // The retry loop catches edge-case P2002 and fetches a fresh number.
  let lastError: unknown = null
  for (let attempt = 0; attempt < MAX_NUMBER_RETRIES; attempt++) {
    try {
      const number = await nextInvoiceNumber(organizationId, "DEVIS")

      const invoice = await prisma.$transaction(async (tx) =>
        tx.invoice.create({
          data: {
            organizationId,
            commandeId,
            number,
            type: "DEVIS",
            status: "DRAFT",
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            totalAmount: commande.totalAmount,
            paidAmount: commande.paidAmount,
            notes: commande.clientNotes,
          },
          include: {
            commande: {
              include: {
                client: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, company: true, siret: true } },
                event: { select: { name: true, startDate: true, location: true } },
                items: true,
              },
            },
          },
        }),
      )

      revalidatePath(`/dashboard/commandes/${commandeId}`)

      return {
        success: true,
        data: serializeInvoice(invoice),
      }
    } catch (err: unknown) {
      lastError = err
      if (isPrismaP2002(err)) {
        continue
      }
      return { success: false, error: err instanceof Error ? err.message : INVOICE.CREATE.QUOTE.ERROR }
    }
  }

  return { success: false, error: lastError instanceof Error ? lastError.message : INVOICE.CREATE.QUOTE.ERROR_RETRIES }
}

export const createQuoteFromCommande = withActionGuard(createQuoteFromCommandeHandler, { name: 'invoices:create' })

async function createInvoiceFromCommandeHandler(commandeId: string): Promise<ActionResponse<InvoiceWithCommande>> {
  const parsed = commandeIdSchema.safeParse({ commandeId })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? INVOICE.INVALID_STATUS }
  }

  const organizationId = await getOrganizationId()
  await assertCan('invoices', 'create')

  const commande = await prisma.commande.findFirst({
    where: { id: parsed.data.commandeId, organizationId },
    include: {
      client: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, company: true, siret: true } },
      event: { select: { name: true, startDate: true, location: true } },
      items: true,
    },
  })

  if (!commande) {
    return { success: false, error: INVOICE.NOT_FOUND_COMMANDE }
  }

  let lastError: unknown = null
  for (let attempt = 0; attempt < MAX_NUMBER_RETRIES; attempt++) {
    try {
      const number = await nextInvoiceNumber(organizationId, "FACTURE")

      const invoice = await prisma.$transaction(async (tx) =>
        tx.invoice.create({
          data: {
            organizationId,
            commandeId,
            number,
            type: "FACTURE",
            status: "DRAFT",
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            totalAmount: commande.totalAmount,
            paidAmount: commande.paidAmount,
            notes: commande.clientNotes,
          },
          include: {
            commande: {
              include: {
                client: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, company: true, siret: true } },
                event: { select: { name: true, startDate: true, location: true } },
                items: true,
              },
            },
          },
        }),
      )

      revalidatePath(`/dashboard/commandes/${commandeId}`)

      return {
        success: true,
        data: serializeInvoice(invoice),
      }
    } catch (err: unknown) {
      lastError = err
      if (isPrismaP2002(err)) {
        continue
      }
      return { success: false, error: err instanceof Error ? err.message : INVOICE.CREATE.INVOICE.ERROR }
    }
  }

  return { success: false, error: lastError instanceof Error ? lastError.message : INVOICE.CREATE.INVOICE.ERROR_RETRIES }
}

export const createInvoiceFromCommande = withActionGuard(createInvoiceFromCommandeHandler, { name: 'invoices:create' })

async function getInvoiceByIdHandler(id: string): Promise<ActionResponse<InvoiceWithCommande>> {
  try {
    getInvoiceByIdSchema.parse({ id });
    const organizationId = await getOrganizationId()
    await assertCan('invoices', 'read')

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        commande: {
          include: {
            client: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, company: true, siret: true } },
            event: { select: { name: true, startDate: true, location: true } },
            items: true,
          },
        },
      },
    })

    if (!invoice) {
      return { success: false, error: INVOICE.NOT_FOUND }
    }

    return { success: true, data: serializeInvoice(invoice) }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : INVOICE.UNEXPECTED_ERROR }
  }
}

export const getInvoiceById = withActionGuard(getInvoiceByIdHandler, { name: 'invoices:read' })

export type PaginatedResult<T> = {
  data: T[]
  total: number
  totalPages: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

async function getInvoicesHandler(params: {
  commandeId?: string
  type?: "DEVIS" | "FACTURE"
  search?: string
  page?: number
  limit?: number
}): Promise<ActionResponse<PaginatedResult<InvoiceWithCommande>>> {
  try {
    getInvoicesSchema.parse(params);
    const organizationId = await getOrganizationId()
    await assertCan('invoices', 'read')
    const { commandeId, type, search, page = 1, limit = 20 } = params
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { organizationId }
    if (commandeId) where.commandeId = commandeId
    if (type) where.type = type
    if (search) {
      where.number = { contains: search, mode: "insensitive" }
    }

    const [total, invoices] = await prisma.$transaction([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: {
          commande: {
            include: {
              client: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, company: true, siret: true } },
              items: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      success: true,
      data: {
        data: invoices.map(serializeInvoice),
        total,
        totalPages,
        page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : INVOICE.UNEXPECTED_ERROR }
  }
}

export const getInvoices = withActionGuard(getInvoicesHandler, { name: 'invoices:read' })

async function updateInvoiceStatusHandler(
  id: string,
  status: string,
): Promise<ActionResponse<InvoiceWithCommande>> {
  try {
    const parsed = updateInvoiceStatusSchema.safeParse({ id, status })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? INVOICE.INVALID_STATUS }
    }

    const organizationId = await getOrganizationId()
    await assertCan('invoices', 'update')

    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: INVOICE.NOT_FOUND }
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: parsed.data.status },
      include: {
        commande: {
          include: {
            client: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, company: true, siret: true } },
            event: { select: { name: true, startDate: true, location: true } },
            items: true,
          },
        },
      },
    })

    revalidatePath(`/dashboard/commandes/${invoice.commandeId}`)

    return { success: true, data: serializeInvoice(invoice) }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : INVOICE.UPDATE.STATUS.ERROR }
  }
}

export const updateInvoiceStatus = withActionGuard(updateInvoiceStatusHandler, { name: 'invoices:update' })

async function convertQuoteToInvoiceHandler(quoteId: string): Promise<ActionResponse<InvoiceWithCommande>> {
  const parsed = quoteIdSchema.safeParse({ quoteId })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? INVOICE.INVALID_STATUS }
  }

  const organizationId = await getOrganizationId()
  await assertCan('invoices', 'create')

  const quote = await prisma.invoice.findFirst({
    where: { id: parsed.data.quoteId, organizationId, type: "DEVIS" },
    include: {
      commande: {
        include: {
          client: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, company: true, siret: true } },
          event: { select: { name: true, startDate: true, location: true } },
          items: true,
        },
      },
    },
  })

  if (!quote) {
    return { success: false, error: INVOICE.NOT_FOUND_QUOTE }
  }

  if (!quote.commande) {
    return { success: false, error: INVOICE.NO_COMMANDE_LINKED }
  }

  let lastError: unknown = null
  for (let attempt = 0; attempt < MAX_NUMBER_RETRIES; attempt++) {
    try {
      const number = await nextInvoiceNumber(organizationId, "FACTURE")

      const invoice = await prisma.$transaction(async (tx) =>
        tx.invoice.create({
          data: {
            organizationId,
            commandeId: quote.commandeId,
            number,
            type: "FACTURE",
            status: "DRAFT",
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            totalAmount: quote.totalAmount,
            paidAmount: quote.paidAmount,
            notes: quote.notes,
          },
          include: {
            commande: {
              include: {
                client: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, company: true, siret: true } },
                event: { select: { name: true, startDate: true, location: true } },
                items: true,
              },
            },
          },
        }),
      )

      revalidatePath(`/dashboard/commandes/${quote.commandeId}`)
      revalidatePath("/dashboard/invoices")

      return {
        success: true,
        data: serializeInvoice(invoice),
      }
    } catch (err: unknown) {
      lastError = err
      if (isPrismaP2002(err)) {
        continue
      }
      return { success: false, error: err instanceof Error ? err.message : INVOICE.CONVERT.ERROR }
    }
  }

  return { success: false, error: lastError instanceof Error ? lastError.message : INVOICE.CONVERT.ERROR_RETRIES }
}

export const convertQuoteToInvoice = withActionGuard(convertQuoteToInvoiceHandler, { name: 'invoices:create' })

function serializeInvoice(invoice: unknown): InvoiceWithCommande {
  const i = invoice as Record<string, unknown>
  const cmd = i.commande as Record<string, unknown> | null

  return {
    id: i.id as string,
    organizationId: i.organizationId as string,
    commandeId: i.commandeId as string | null,
    number: i.number as string,
    type: i.type as "DEVIS" | "FACTURE",
    status: i.status as Invoice["status"],
    issueDate: i.issueDate as Date,
    dueDate: i.dueDate as Date | null,
    totalAmount: Number(i.totalAmount),
    paidAmount: Number(i.paidAmount),
    notes: i.notes as string | null,
    pdfUrl: i.pdfUrl as string | null,
    createdAt: i.createdAt as Date,
    updatedAt: i.updatedAt as Date,
    commande: cmd
      ? {
          id: cmd.id as string,
          number: cmd.number as string,
          status: cmd.status as string,
          totalAmount: Number(cmd.totalAmount),
          acompteAmount: Number(cmd.acompteAmount),
          paidAmount: Number(cmd.paidAmount),
          remainingAmount: Number(cmd.remainingAmount),
          transportFees: cmd.transportFees != null ? Number(cmd.transportFees) : null,
          deliveryFees: cmd.deliveryFees != null ? Number(cmd.deliveryFees) : null,
          equipmentFees: cmd.equipmentFees != null ? Number(cmd.equipmentFees) : null,
          discountType: cmd.discountType as string | null,
          discountValue: cmd.discountValue != null ? Number(cmd.discountValue) : null,
          discountAmount: cmd.discountAmount != null ? Number(cmd.discountAmount) : null,
          taxRate: cmd.taxRate != null ? Number(cmd.taxRate) : null,
          taxLabel: cmd.taxLabel as string | null,
          taxAmount: cmd.taxAmount != null ? Number(cmd.taxAmount) : null,
          notes: cmd.notes as string | null,
          clientNotes: cmd.clientNotes as string | null,
          items: ((cmd.items ?? []) as Array<Record<string, unknown>>).map((item) => ({
            id: item.id as string,
            name: item.name as string,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
            notes: item.notes as string | null,
          })),
          client: cmd.client
            ? {
                id: (cmd.client as Record<string, unknown>).id as string,
                name: (cmd.client as Record<string, unknown>).name as string,
                email: (cmd.client as Record<string, unknown>).email as string | null,
                phone: (cmd.client as Record<string, unknown>).phone as string | null,
                address: (cmd.client as Record<string, unknown>).address as string | null,
                city: (cmd.client as Record<string, unknown>).city as string | null,
                postalCode: (cmd.client as Record<string, unknown>).postalCode as string | null,
                company: (cmd.client as Record<string, unknown>).company as string | null,
                siret: (cmd.client as Record<string, unknown>).siret as string | null,
              }
            : null,
          event: cmd.event
            ? {
                name: (cmd.event as Record<string, unknown>).name as string | null,
                startDate: (cmd.event as Record<string, unknown>).startDate as Date | null,
                location: (cmd.event as Record<string, unknown>).location as string | null,
              }
            : null,
        }
      : null,
  }
}
