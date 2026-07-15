"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { COMMANDE } from "@/lib/notify/messages"
import { assertCan } from "@/lib/assert-role"
import { withActionGuard } from "@/lib/action-guard"
import { revalidatePath } from "next/cache"

const createAttachmentSchema = z.object({
  commandeId: z.string().min(1),
  name: z.string().min(1, COMMANDE.VALIDATION.ATTACHMENT_NAME_REQUIRED),
  url: z.string().min(1, COMMANDE.VALIDATION.ATTACHMENT_URL_REQUIRED),
  type: z.string().min(1, COMMANDE.VALIDATION.ATTACHMENT_TYPE_REQUIRED),
})

async function createCommandeAttachmentHandler(
  commandeId: string,
  name: string,
  url: string,
  type: string,
) {
  try {
    const parsed = createAttachmentSchema.safeParse({ commandeId, name, url, type })
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.issues[0]?.message ?? COMMANDE.VALIDATION.INVALID_DATA }
    }

    const organizationId = await getOrganizationId()
    await assertCan('commandes', 'update')
    const commande = await prisma.commande.findFirst({
      where: { id: commandeId, organizationId },
      select: { id: true },
    })
    if (!commande) return { success: false as const, error: COMMANDE.NOT_FOUND }

    await prisma.commandeAttachment.create({
      data: { commandeId, name, url, type },
    })

    revalidatePath(`/dashboard/commandes/${commandeId}`)

    return { success: true as const }
  } catch (err: unknown) {
    return { success: false as const, error: err instanceof Error ? err.message : COMMANDE.ATTACHMENT.ERROR }
  }
}

export const createCommandeAttachment = withActionGuard(createCommandeAttachmentHandler, { name: 'commandes:update' })
