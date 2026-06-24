"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { assertCan } from "@/lib/assert-role"
import { updateInvoiceStatusSchema } from "@/features/invoices/validations/invoice-schemas"
import type { ActionResponse, Invoice, InvoiceWithCommande } from "@/features/invoices/types"

async function generateInvoiceNumber(type: "DEVIS" | "FACTURE"): Promise<string> {
  const organizationId = await getOrganizationId()
  const year = new Date().getFullYear()
  const prefix = type === "DEVIS" ? "DEV" : "FAC"
  const count = await prisma.invoice.count({
    where: {
      organizationId,
      type,
      issueDate: { gte: new Date(`${year}-01-01`) },
    },
  })
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`
}

export async function createQuoteFromCommande(commandeId: string): Promise<ActionResponse<InvoiceWithCommande>> {
  try {
    const organizationId = await getOrganizationId()
    await assertCan('invoices', 'create')

    const commande = await prisma.commande.findFirst({
      where: { id: commandeId, organizationId },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, company: true, siret: true } },
        event: { select: { name: true, startDate: true, location: true } },
        items: true,
      },
    })

    if (!commande) {
      return { success: false, error: "Commande introuvable" }
    }

    const number = await generateInvoiceNumber("DEVIS")

    const invoice = await prisma.invoice.create({
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
    })

    revalidatePath(`/dashboard/commandes/${commandeId}`)

    return {
      success: true,
      data: serializeInvoice(invoice),
    }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur lors de la création du devis" }
  }
}

export async function createInvoiceFromCommande(commandeId: string): Promise<ActionResponse<InvoiceWithCommande>> {
  try {
    const organizationId = await getOrganizationId()
    await assertCan('invoices', 'create')

    const commande = await prisma.commande.findFirst({
      where: { id: commandeId, organizationId },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, company: true, siret: true } },
        event: { select: { name: true, startDate: true, location: true } },
        items: true,
      },
    })

    if (!commande) {
      return { success: false, error: "Commande introuvable" }
    }

    const number = await generateInvoiceNumber("FACTURE")

    const invoice = await prisma.invoice.create({
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
    })

    revalidatePath(`/dashboard/commandes/${commandeId}`)

    return {
      success: true,
      data: serializeInvoice(invoice),
    }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur lors de la création de la facture" }
  }
}

export async function getInvoiceById(id: string): Promise<ActionResponse<InvoiceWithCommande>> {
  try {
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
      return { success: false, error: "Document introuvable" }
    }

    return { success: true, data: serializeInvoice(invoice) }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur" }
  }
}

export type PaginatedResult<T> = {
  data: T[]
  total: number
  totalPages: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export async function getInvoices(params: {
  commandeId?: string
  type?: "DEVIS" | "FACTURE"
  search?: string
  page?: number
  limit?: number
}): Promise<ActionResponse<PaginatedResult<InvoiceWithCommande>>> {
  try {
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
    return { success: false, error: err instanceof Error ? err.message : "Erreur" }
  }
}

export async function updateInvoiceStatus(
  id: string,
  status: string,
): Promise<ActionResponse<InvoiceWithCommande>> {
  try {
    const parsed = updateInvoiceStatusSchema.safeParse({ id, status })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Statut invalide" }
    }

    const organizationId = await getOrganizationId()
    await assertCan('invoices', 'update')

    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Document introuvable" }
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
    return { success: false, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour" }
  }
}

export async function convertQuoteToInvoice(quoteId: string): Promise<ActionResponse<InvoiceWithCommande>> {
  try {
    const organizationId = await getOrganizationId()
    await assertCan('invoices', 'create')

    const quote = await prisma.invoice.findFirst({
      where: { id: quoteId, organizationId, type: "DEVIS" },
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
      return { success: false, error: "Devis introuvable" }
    }

    if (!quote.commande) {
      return { success: false, error: "Le devis n'est lié à aucune commande" }
    }

    const number = await generateInvoiceNumber("FACTURE")

    const invoice = await prisma.invoice.create({
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
    })

    revalidatePath(`/dashboard/commandes/${quote.commandeId}`)
    revalidatePath("/dashboard/invoices")

    return {
      success: true,
      data: serializeInvoice(invoice),
    }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur lors de la conversion du devis" }
  }
}

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
