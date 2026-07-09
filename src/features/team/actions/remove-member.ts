"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { AUTH } from "@/lib/notify/messages"
import { revalidatePath } from "next/cache"

export async function removeMember(memberId: string) {
  try {
    const membership = await getCurrentMembership()
    await assertCan("team", "remove")

    const target = await prisma.userOrganization.findUnique({
      where: { id: memberId },
    })

    if (!target || target.organizationId !== membership.organizationId) {
      return { success: false, error: AUTH.MEMBER.NOT_FOUND }
    }

    if (target.userId === membership.userId) {
      return { success: false, error: AUTH.MEMBER.CANNOT_REMOVE_SELF }
    }

    // ADMIN can only remove MEMBER
    if (membership.role === "ADMIN" && target.role !== "MEMBER") {
      return { success: false, error: AUTH.MEMBER.CAN_ONLY_REMOVE_MEMBERS }
    }

    // OWNER protection: cannot remove the last OWNER
    if (target.role === "OWNER") {
      const ownerCount = await prisma.userOrganization.count({
        where: { organizationId: membership.organizationId, role: "OWNER" },
      })
      if (ownerCount <= 1) {
        return { success: false, error: AUTH.MEMBER.CANNOT_DELETE_LAST_OWNER }
      }
    }

    await prisma.userOrganization.delete({ where: { id: memberId } })

    // AUDIT_POINT: MEMBER_REMOVED — { targetUserId: target.userId, role: target.role }

    revalidatePath("/dashboard/settings/team")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : AUTH.MEMBER.REMOVE_ERROR }
  }
}
