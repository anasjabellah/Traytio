"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { revalidatePath } from "next/cache"

export async function cancelInvitation(invitationId: string) {
  try {
    const membership = await getCurrentMembership()
    await assertCan("team", "remove")

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    })

    if (!invitation || invitation.organizationId !== membership.organizationId) {
      return { success: false, error: "Invitation introuvable" }
    }

    await prisma.invitation.delete({ where: { id: invitationId } })

    // AUDIT_POINT: INVITATION_CANCELLED — { email: invitation.email }

    revalidatePath("/dashboard/settings/team")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to cancel invitation" }
  }
}
