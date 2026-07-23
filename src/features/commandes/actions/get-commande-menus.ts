"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { COMMANDE } from "@/lib/notify/messages"
import { assertCan } from "@/lib/assert-role"
import { withActionGuard } from "@/lib/action-guard"
import { normalizeActionError } from "@/lib/action-error"

async function getCommandeMenusHandler() {
  try {
    const organizationId = await getOrganizationId()
    await assertCan('menus', 'read')

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
                notes: true,
                imageUrl: true,
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
        notes: mi.menuItem.notes,
        imageUrl: mi.menuItem.imageUrl,
        defaultQty: mi.defaultQty,
      })),
    }))
  } catch (err: unknown) {
    return { error: normalizeActionError(err, COMMANDE.FETCH_ERROR_MENUS) }
  }
}

export const getCommandeMenus = withActionGuard(getCommandeMenusHandler, { name: 'menus:read' })
