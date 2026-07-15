"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { COMMANDE } from "@/lib/notify/messages"
import { assertCan } from "@/lib/assert-role"
import { withActionGuard } from "@/lib/action-guard"

async function getCommandeAllMenuItemsHandler() {
  try {
    const organizationId = await getOrganizationId()
    await assertCan('menu-items', 'read')

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
    return { error: err.message || COMMANDE.FETCH_ERROR_ITEMS }
  }
}

export const getCommandeAllMenuItems = withActionGuard(getCommandeAllMenuItemsHandler, { name: 'menu-items:read' })
