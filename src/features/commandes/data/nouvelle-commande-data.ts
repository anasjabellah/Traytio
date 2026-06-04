"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/features/commandes/_helpers"

export async function getCommandeClients() {
  const organizationId = await getOrganizationId()
  return prisma.client.findMany({
    where: { organizationId },
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { name: "asc" },
  })
}

export async function getCommandeMenuItems() {
  const organizationId = await getOrganizationId()
  return prisma.menuItem.findMany({
    where: { organizationId, isActive: true },
    select: {
      id: true, name: true, category: true,
      unitPrice: true, unit: true, imageUrl: true,
    },
    orderBy: { category: "asc" },
  })
}

export async function getCommandeMenus() {
  const organizationId = await getOrganizationId()
  return prisma.menu.findMany({
    where: { organizationId, isActive: true },
    select: {
      id: true, name: true, category: true,
      pricePerPerson: true, minPersons: true,
      menuItems: {
        select: {
          menuItemId: true,
          defaultQty: true,
          menuItem: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  })
}
