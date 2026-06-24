"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export async function acceptInvite(token: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return { success: false, error: "Vous devez être connecté pour accepter une invitation" }
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: { select: { name: true } } },
    })

    if (!invitation) {
      return { success: false, error: "Invitation invalide ou inexistante" }
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.delete({ where: { id: invitation.id } })
      return { success: false, error: "Cette invitation a expiré" }
    }

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      return { success: false, error: "Utilisateur introuvable" }
    }

    if (user.email !== invitation.email) {
      return { success: false, error: `Cette invitation a été envoyée à ${invitation.email}, pas à ${user.email}` }
    }

    const existing = await prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: invitation.organizationId } },
    })
    if (existing) {
      await prisma.invitation.delete({ where: { id: invitation.id } })
      return { success: true, data: { organizationName: invitation.organization.name } }
    }

    await prisma.$transaction(async (tx) => {
      await tx.userOrganization.create({
        data: { userId: user.id, organizationId: invitation.organizationId, role: invitation.role },
      })
      await tx.invitation.delete({ where: { id: invitation.id } })
    })

    // AUDIT_POINT: INVITATION_ACCEPTED — { email: invitation.email, role: invitation.role, userId: user.id }

    revalidatePath("/dashboard")
    return { success: true, data: { organizationName: invitation.organization.name } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to accept invitation" }
  }
}
