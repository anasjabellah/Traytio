"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { revalidatePath } from "next/cache"

export async function removeMember(memberId: string) {
  try {
    const membership = await getCurrentMembership()
    await assertCan("team", "remove")

    const target = await prisma.userOrganization.findUnique({
      where: { id: memberId },
    })

    if (!target || target.organizationId !== membership.organizationId) {
      return { success: false, error: "Membre introuvable" }
    }

    if (target.userId === membership.userId) {
      return { success: false, error: "Vous ne pouvez pas vous retirer vous-même" }
    }

    // ADMIN can only remove MEMBER
    if (membership.role === "ADMIN" && target.role !== "MEMBER") {
      return { success: false, error: "Vous ne pouvez supprimer que les membres" }
    }

    // OWNER protection: cannot remove the last OWNER
    if (target.role === "OWNER") {
      const ownerCount = await prisma.userOrganization.count({
        where: { organizationId: membership.organizationId, role: "OWNER" },
      })
      if (ownerCount <= 1) {
        return { success: false, error: "Impossible de supprimer le dernier propriétaire" }
      }
    }

    await prisma.userOrganization.delete({ where: { id: memberId } })

    // AUDIT_POINT: MEMBER_REMOVED — { targetUserId: target.userId, role: target.role }

    revalidatePath("/dashboard/settings/team")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to remove member" }
  }
}
