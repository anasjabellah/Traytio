"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { COMMANDE } from "@/lib/notify/messages"
import { assertCan } from "@/lib/assert-role"

const getCommandeClientsSchema = z.object({
  search: z.string().max(100).optional(),
})

export async function getCommandeClients(search?: string) {
  try {
    getCommandeClientsSchema.parse({ search })
    const organizationId = await getOrganizationId()
    await assertCan('clients', 'read')
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
    return { error: err.message || COMMANDE.FETCH_ERROR_CLIENTS }
  }
}
