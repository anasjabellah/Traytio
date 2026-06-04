"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/features/commandes/_helpers"

export async function getCommandeMenuItems() {
  try {
    const organizationId = await getOrganizationId()

    const items = await prisma.menuItem.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true,
        name: true,
        notes: true,
        unitPrice: true,
        category: true,
        unit: true,
      },
      orderBy: { name: "asc" },
    })

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.notes ?? null,
      price: Number(item.unitPrice),
      category: item.category,
      unit: item.unit ?? null,
    }))
  } catch (err: any) {
    return { error: err.message || "Erreur lors du chargement des articles" }
  }
}
