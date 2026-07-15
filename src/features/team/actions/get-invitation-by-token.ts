"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { AUTH } from "@/lib/notify/messages"

const getInvitationByTokenSchema = z.object({
  token: z.string().min(1),
})

export async function getInvitationByToken(token: string) {
  try {
    getInvitationByTokenSchema.parse({ token })
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: { select: { name: true } } },
    })

    if (!invitation) {
      return { success: false, error: AUTH.INVITATION.INVALID_OR_MISSING }
    }

    if (invitation.expiresAt < new Date()) {
      return { success: false, error: AUTH.INVITATION.EXPIRED }
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
    return { success: false, error: err instanceof Error ? err.message : AUTH.FETCH_ERROR }
  }
}
