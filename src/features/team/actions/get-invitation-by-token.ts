"use server"

import { prisma } from "@/lib/prisma"

export async function getInvitationByToken(token: string) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: { select: { name: true } } },
    })

    if (!invitation) {
      return { success: false, error: "Invitation invalide ou inexistante" }
    }

    if (invitation.expiresAt < new Date()) {
      return { success: false, error: "Cette invitation a expiré" }
    }

    return {
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organization.name,
      },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch invitation" }
  }
}
