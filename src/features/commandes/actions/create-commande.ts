"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/features/commandes/_helpers"

export async function generateCommandeNumber(): Promise<string> {
  const organizationId = await getOrganizationId()
  const year = new Date().getFullYear()
  const count = await prisma.commande.count({
    where: { organizationId, createdAt: { gte: new Date(`${year}-01-01`) } },
  })
  return `CMD-${year}-${String(count + 1).padStart(3, "0")}`
}

type CreateCommandeInput = {
  number: string
  clientId: string
  eventType?: string | null
  eventDate?: string | null
  guestCount?: number | null
  location?: string | null
  menuId?: string | null
  menuName?: string | null
  pricePerPerson?: number | null
  totalAmount?: number | null
  notes?: string | null
  status?: string
  items: {
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    menuItemId?: string | null
  }[]
}

export async function createCommande(data: CreateCommandeInput) {
  try {
    const organizationId = await getOrganizationId()

    const commande = await prisma.commande.create({
      data: {
        organizationId,
        clientId: data.clientId,
        number: data.number,
        status: (data.status as any) ?? "DRAFT",
        eventType: (data.eventType as any) ?? undefined,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        guestCount: data.guestCount ?? undefined,
        location: data.location ?? undefined,
        menuId: data.menuId ?? undefined,
        menuName: data.menuName ?? undefined,
        pricePerPerson: data.pricePerPerson ?? undefined,
        totalAmount: data.totalAmount ?? 0,
        notes: data.notes ?? undefined,
        acompteAmount: 0,
        paidAmount: 0,
        remainingAmount: data.totalAmount ?? 0,
        items: {
          create: data.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            menuItemId: item.menuItemId ?? undefined,
          })),
        },
      },
      include: { items: true, client: true },
    })

    return { success: true, data: commande }
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Failed to create commande" }
  }
}
