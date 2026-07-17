"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withActionGuard } from "@/lib/action-guard"
import { AUTH } from "@/lib/notify/messages"
import { normalizeActionError } from "@/lib/action-error"

const getInvitationByTokenSchema = z.object({
  token: z.string().min(1),
})

async function getInvitationByTokenHandler(token: string) {
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
    return { success: false, error: normalizeActionError(err, AUTH.FETCH_ERROR) }
  }
}

export const getInvitationByToken = withActionGuard(getInvitationByTokenHandler, { name: 'team:read' })
