"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"

export async function getCommandeAllMenuItems() {
  try {
    const organizationId = await getOrganizationId()

    const items = await prisma.menuItem.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        unitPrice: true,
        unit: true,
        notes: true,
        imageUrl: true,
      },
      orderBy: { name: "asc" },
    })

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unitPrice: Number(item.unitPrice),
      unit: item.unit,
      notes: item.notes,
      imageUrl: item.imageUrl,
    }))
  } catch (err: any) {
    return { error: err.message || "Erreur lors du chargement des articles" }
  }
}
