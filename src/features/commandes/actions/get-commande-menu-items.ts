"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { COMMANDE } from "@/lib/notify/messages"
import { assertCan } from "@/lib/assert-role"
import { withActionGuard } from "@/lib/action-guard"
import { normalizeActionError } from "@/lib/action-error"

async function getCommandeMenuItemsHandler() {
  try {
    const organizationId = await getOrganizationId()
    await assertCan('menu-items', 'read')

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
  } catch (err: unknown) {
    return { error: normalizeActionError(err, COMMANDE.FETCH_ERROR_ITEMS) }
  }
}

export const getCommandeMenuItems = withActionGuard(getCommandeMenuItemsHandler, { name: 'menu-items:read' })
