"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"

export async function createClient(data: {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}) {
  try {
    const organizationId = await getOrganizationId()

    const client = await prisma.client.create({
      data: {
        organizationId,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
      },
    })

    return {
      success: true as const,
      data: {
        id: client.id,
        name: client.name,
        phone: client.phone ?? undefined,
        email: client.email ?? undefined,
        address: client.address ?? undefined,
        notes: client.notes ?? undefined,
        vip: false,
        events: 0,
      },
    }
  } catch (err: unknown) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Erreur lors de la création du client",
    }
  }
}
