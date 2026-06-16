"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"

export async function createCommandeAttachment(
  commandeId: string,
  name: string,
  url: string,
  type: string,
) {
  try {
    const organizationId = await getOrganizationId()
    const commande = await prisma.commande.findFirst({
      where: { id: commandeId, organizationId },
      select: { id: true },
    })
    if (!commande) return { success: false as const, error: "Commande not found" }

    await prisma.commandeAttachment.create({
      data: { commandeId, name, url, type },
    })

    return { success: true as const }
  } catch (err: unknown) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to create attachment" }
  }
}
