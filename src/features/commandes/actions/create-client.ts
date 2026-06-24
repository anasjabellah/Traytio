"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { assertCan } from "@/lib/assert-role"
import { revalidatePath } from "next/cache"

const createCommandesClientSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  phone: z.string().nullable().optional(),
  email: z.string().email("Email invalide").nullable().optional().or(z.literal("")),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function createClient(input: unknown) {
  try {
    const parsed = createCommandesClientSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
    }

    const data = parsed.data
    const organizationId = await getOrganizationId()
    await assertCan('clients', 'create')

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

    revalidatePath("/dashboard/commandes")
    revalidatePath("/dashboard/clients")

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
