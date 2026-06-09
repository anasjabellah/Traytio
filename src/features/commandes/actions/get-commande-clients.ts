"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"

export async function getCommandeClients(search?: string) {
  try {
    const organizationId = await getOrganizationId()
    const where: Record<string, unknown> = { organizationId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }

    const clients = await prisma.client.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        _count: { select: { commandes: true, events: true } },
      },
      orderBy: { name: "asc" },
    })

    return clients.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone ?? null,
      email: c.email ?? null,
      address: c.address ?? null,
      vip: false,
    }))
  } catch (err: any) {
    return { error: err.message || "Erreur lors du chargement des clients" }
  }
}
