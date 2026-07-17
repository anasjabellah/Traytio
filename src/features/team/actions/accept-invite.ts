"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { withActionGuard } from "@/lib/action-guard"
import { AUTH } from "@/lib/notify/messages"
import { normalizeActionError } from "@/lib/action-error"
import { revalidatePath } from "next/cache"

const acceptInviteSchema = z.object({
  token: z.string().min(1),
})

async function acceptInviteHandler(token: string) {
  try {
    const parsed = acceptInviteSchema.safeParse({ token })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? AUTH.ACCEPT.ERROR }
    }

    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return { success: false, error: AUTH.SESSION.REQUIRED }
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: { select: { name: true } } },
    })

    if (!invitation) {
      return { success: false, error: AUTH.INVITATION.INVALID_OR_MISSING }
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.delete({ where: { id: invitation.id } })
      return { success: false, error: AUTH.INVITATION.EXPIRED }
    }

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      return { success: false, error: AUTH.USER_NOT_FOUND }
    }

    if (user.email !== invitation.email) {
      return { success: false, error: AUTH.INVITATION.EMAIL_MISMATCH(invitation.email, user.email) }
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
    return { success: false, error: normalizeActionError(err, AUTH.ACCEPT.ERROR) }
  }
}

export const acceptInvite = withActionGuard(acceptInviteHandler, { name: 'team:accept', public: true })
