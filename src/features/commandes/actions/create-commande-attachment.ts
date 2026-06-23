"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { revalidatePath } from "next/cache"

const createAttachmentSchema = z.object({
  commandeId: z.string().min(1),
  name: z.string().min(1, "Le nom est requis"),
  url: z.string().min(1, "L'URL est requise"),
  type: z.string().min(1, "Le type est requis"),
})

export async function createCommandeAttachment(
  commandeId: string,
  name: string,
  url: string,
  type: string,
) {
  try {
    const parsed = createAttachmentSchema.safeParse({ commandeId, name, url, type })
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
    }

    const organizationId = await getOrganizationId()
    const commande = await prisma.commande.findFirst({
      where: { id: commandeId, organizationId },
      select: { id: true },
    })
    if (!commande) return { success: false as const, error: "Commande introuvable" }

    await prisma.commandeAttachment.create({
      data: { commandeId, name, url, type },
    })

    revalidatePath(`/dashboard/commandes/${commandeId}`)

    return { success: true as const }
  } catch (err: unknown) {
    return { success: false as const, error: err instanceof Error ? err.message : "Erreur lors de la création de la pièce jointe" }
  }
}
