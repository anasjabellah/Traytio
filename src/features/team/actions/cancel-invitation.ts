"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { AUTH } from "@/lib/notify/messages"
import { normalizeActionError } from "@/lib/action-error"
import { withActionGuard } from "@/lib/action-guard"
import { revalidatePath } from "next/cache"

const cancelInvitationSchema = z.object({
  invitationId: z.string().min(1),
})

async function cancelInvitationHandler(invitationId: string) {
  try {
    const parsed = cancelInvitationSchema.safeParse({ invitationId })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? AUTH.INVITATION.CANCEL_ERROR }
    }

    const membership = await getCurrentMembership()
    await assertCan("team", "remove")

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    })

    if (!invitation || invitation.organizationId !== membership.organizationId) {
      return { success: false, error: AUTH.INVITATION.NOT_FOUND }
    }

    await prisma.invitation.delete({ where: { id: invitationId } })

    // AUDIT_POINT: INVITATION_CANCELLED — { email: invitation.email }

    revalidatePath("/dashboard/settings/team")
    return { success: true }
  } catch (err) {
    return { success: false, error: normalizeActionError(err, AUTH.INVITATION.CANCEL_ERROR) }
  }
}

export const cancelInvitation = withActionGuard(cancelInvitationHandler, { name: 'team:remove' })
