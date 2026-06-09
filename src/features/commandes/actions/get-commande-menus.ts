"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"

export async function getCommandeMenus() {
  try {
    const organizationId = await getOrganizationId()

    const menus = await prisma.menu.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        pricePerPerson: true,
        menuItems: {
          select: {
            menuItemId: true,
            defaultQty: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                category: true,
                unitPrice: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return menus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      description: menu.description,
      price: Number(menu.pricePerPerson),
      items: menu.menuItems.map((mi) => ({
        id: mi.menuItem.id,
        name: mi.menuItem.name,
        category: mi.menuItem.category,
        unitPrice: Number(mi.menuItem.unitPrice),
        unit: mi.menuItem.unit,
        defaultQty: mi.defaultQty,
      })),
    }))
  } catch (err: any) {
    return { error: err.message || "Erreur lors du chargement des menus" }
  }
}
