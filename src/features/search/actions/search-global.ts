"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentMembership } from "@/lib/assert-role"
import { withActionGuard } from "@/lib/action-guard"
import { COMMON } from "@/lib/notify/messages/common"

type ActionResponse<T = void> = {
  success: boolean
  data?: T
  error?: string
}

const searchGlobalSchema = z.object({
  query: z.string().max(100),
})

export type SearchResultItem = {
  id: string
  label: string
  subtitle: string
  href: string
  badge?: string
}

export type SearchGroup = {
  key: string
  label: string
  items: SearchResultItem[]
}

export type GlobalSearchResults = {
  clients: SearchResultItem[]
  commandes: SearchResultItem[]
  invoices: SearchResultItem[]
  events: SearchResultItem[]
  payments: SearchResultItem[]
  menus: SearchResultItem[]
  menuItems: SearchResultItem[]
  members: SearchResultItem[]
}

async function searchGlobalHandler(query: string): Promise<ActionResponse<GlobalSearchResults>> {
  try {
    searchGlobalSchema.parse({ query })
    const trimmed = query.trim()
    if (!trimmed) {
      return { success: true, data: { clients: [], commandes: [], invoices: [], events: [], payments: [], menus: [], menuItems: [], members: [] } }
    }

    const membership = await getCurrentMembership()
    const orgId = membership.organizationId
    const q = `%${trimmed}%`

    const [clients, commandes, invoices, events, payments, menus, menuItems, members] = await Promise.all([
      prisma.client.findMany({
        where: { organizationId: orgId, name: { contains: trimmed, mode: "insensitive" } },
        take: 5,
        select: { id: true, name: true, email: true, company: true },
      }),
      prisma.commande.findMany({
        where: { organizationId: orgId, number: { contains: trimmed, mode: "insensitive" } },
        take: 5,
        select: { id: true, number: true, status: true, client: { select: { name: true } } },
      }),
      prisma.invoice.findMany({
        where: { organizationId: orgId, number: { contains: trimmed, mode: "insensitive" } },
        take: 5,
        select: { id: true, number: true, type: true, status: true, totalAmount: true },
      }),
      prisma.event.findMany({
        where: { organizationId: orgId, name: { contains: trimmed, mode: "insensitive" } },
        take: 5,
        select: { id: true, name: true, type: true, startDate: true },
      }),
      prisma.payment.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { reference: { contains: trimmed, mode: "insensitive" } },
            { notes: { contains: trimmed, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, amount: true, method: true, status: true, reference: true, commande: { select: { number: true } } },
      }),
      prisma.menu.findMany({
        where: { organizationId: orgId, name: { contains: trimmed, mode: "insensitive" } },
        take: 5,
        select: { id: true, name: true, category: true, pricePerPerson: true },
      }),
      prisma.menuItem.findMany({
        where: { organizationId: orgId, name: { contains: trimmed, mode: "insensitive" } },
        take: 5,
        select: { id: true, name: true, category: true, unitPrice: true },
      }),
      prisma.userOrganization.findMany({
        where: {
          organizationId: orgId,
          user: {
            OR: [
              { firstName: { contains: trimmed, mode: "insensitive" } },
              { lastName: { contains: trimmed, mode: "insensitive" } },
              { email: { contains: trimmed, mode: "insensitive" } },
            ],
          },
        },
        take: 5,
        select: { id: true, role: true, user: { select: { firstName: true, lastName: true, email: true } } },
      }),
    ])

    return {
      success: true,
      data: {
        clients: clients.map((c) => ({
          id: c.id,
          label: c.name,
          subtitle: c.company ? `${c.email ?? ""} · ${c.company}` : (c.email ?? ""),
          href: `/dashboard/clients/${c.id}`,
        })),
        commandes: commandes.map((c) => ({
          id: c.id,
          label: c.number,
          subtitle: c.client?.name ?? "",
          href: `/dashboard/commandes/${c.id}`,
          badge: c.status,
        })),
        invoices: invoices.map((inv) => ({
          id: inv.id,
          label: inv.number,
          subtitle: inv.type === "DEVIS" ? "Devis" : "Facture",
          href: `/dashboard/invoices/${inv.id}`,
          badge: inv.status,
        })),
        events: events.map((e) => ({
          id: e.id,
          label: e.name,
          subtitle: e.type,
          href: `/dashboard/events/${e.id}`,
        })),
        payments: payments.map((p) => ({
          id: p.id,
          label: `+${Number(p.amount).toLocaleString("fr-FR")} MAD`,
          subtitle: p.reference ? `${p.reference} · ${p.commande?.number ?? ""}` : (p.commande?.number ?? ""),
          href: `/dashboard/payments/${p.id}`,
          badge: p.status,
        })),
        menus: menus.map((m) => ({
          id: m.id,
          label: m.name,
          subtitle: `${m.category} · ${Number(m.pricePerPerson).toLocaleString("fr-FR")} MAD/pers`,
          href: `/dashboard/menus/${m.id}`,
        })),
        menuItems: menuItems.map((mi) => ({
          id: mi.id,
          label: mi.name,
          subtitle: `${mi.category} · ${Number(mi.unitPrice).toLocaleString("fr-FR")} MAD`,
          href: `/dashboard/menu-items/${mi.id}`,
        })),
        members: members.map((m) => ({
          id: m.id,
          label: `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() || m.user.email,
          subtitle: m.user.email,
          href: `/dashboard/settings/team`,
          badge: m.role,
        })),
      },
    }
  } catch {
    return { success: false, error: COMMON.UNEXPECTED_ERROR }
  }
}

export const searchGlobal = withActionGuard(searchGlobalHandler, { name: "search:global" })
