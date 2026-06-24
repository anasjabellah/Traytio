"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { OrgRole } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function changeMemberRole(input: { memberId: string; newRole: OrgRole }) {
  try {
    const membership = await getCurrentMembership()
    await assertCan("team", "change-role")

    const { memberId, newRole } = input

    const target = await prisma.userOrganization.findUnique({
      where: { id: memberId },
    })

    if (!target || target.organizationId !== membership.organizationId) {
      return { success: false, error: "Membre introuvable" }
    }

    if (target.userId === membership.userId) {
      return { success: false, error: "Vous ne pouvez pas modifier votre propre rôle" }
    }

    // ADMIN can only modify MEMBER roles
    if (membership.role === "ADMIN" && target.role !== "MEMBER") {
      return { success: false, error: "Vous ne pouvez modifier que les rôles des membres" }
    }

    // OWNER protection: cannot demote the last OWNER
    if (target.role === "OWNER" && newRole !== "OWNER") {
      const ownerCount = await prisma.userOrganization.count({
        where: { organizationId: membership.organizationId, role: "OWNER" },
      })
      if (ownerCount <= 1) {
        return { success: false, error: "Impossible de rétrograder le dernier propriétaire" }
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
    return { success: false, error: err instanceof Error ? err.message : "Failed to change role" }
  }
}
