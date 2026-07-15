"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { AUTH } from "@/lib/notify/messages"
import { OrgRole } from "@prisma/client"
import { withActionGuard } from "@/lib/action-guard"
import { revalidatePath } from "next/cache"

const changeMemberRoleSchema = z.object({
  memberId: z.string().min(1),
  newRole: z.nativeEnum(OrgRole),
})

async function changeMemberRoleHandler(input: { memberId: string; newRole: OrgRole }) {
  try {
    const parsed = changeMemberRoleSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? AUTH.ROLE.CHANGE_ERROR }
    }

    const { memberId, newRole } = parsed.data
    const membership = await getCurrentMembership()
    await assertCan("team", "change-role")

    const target = await prisma.userOrganization.findUnique({
      where: { id: memberId },
    })

    if (!target || target.organizationId !== membership.organizationId) {
      return { success: false, error: AUTH.MEMBER.NOT_FOUND }
    }

    if (target.userId === membership.userId) {
      return { success: false, error: AUTH.ROLE.CANNOT_CHANGE_OWN_ROLE }
    }

    // ADMIN can only modify MEMBER roles
    if (membership.role === "ADMIN" && target.role !== "MEMBER") {
      return { success: false, error: AUTH.ROLE.CAN_ONLY_CHANGE_MEMBERS }
    }

    // OWNER protection: cannot demote the last OWNER
    if (target.role === "OWNER" && newRole !== "OWNER") {
      const ownerCount = await prisma.userOrganization.count({
        where: { organizationId: membership.organizationId, role: "OWNER" },
      })
      if (ownerCount <= 1) {
        return { success: false, error: AUTH.ROLE.CANNOT_DOWNGRADE_LAST_OWNER }
      }
    }

    await prisma.userOrganization.update({
      where: { id: memberId },
      data: { role: newRole },
    })

    // AUDIT_POINT: ROLE_CHANGED — { targetUserId: target.userId, oldRole: target.role, newRole }

    revalidatePath("/dashboard/settings/team")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : AUTH.ROLE.CHANGE_ERROR }
  }
}

export const changeMemberRole = withActionGuard(changeMemberRoleHandler, { name: 'team:change-role' })
