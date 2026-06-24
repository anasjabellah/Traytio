"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { OrgRole } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function transferOwnership(targetMemberId: string) {
  try {
    const membership = await getCurrentMembership()
    await assertCan("team", "change-role")

    if (membership.role !== "OWNER") {
      return { success: false, error: "Seul le propriétaire peut transférer la propriété" }
    }

    const [target, currentMember] = await Promise.all([
      prisma.userOrganization.findUnique({ where: { id: targetMemberId } }),
      prisma.userOrganization.findFirst({
        where: { userId: membership.userId, organizationId: membership.organizationId },
      }),
    ])

    if (!target || target.organizationId !== membership.organizationId) {
      return { success: false, error: "Membre introuvable" }
    }

    if (target.role !== "ADMIN") {
      return { success: false, error: "Vous ne pouvez transférer la propriété qu'à un administrateur" }
    }

    if (target.userId === membership.userId) {
      return { success: false, error: "Vous êtes déjà le propriétaire" }
    }

    if (!currentMember) {
      return { success: false, error: "Membre introuvable" }
    }

    await prisma.$transaction(async (tx) => {
      await tx.userOrganization.update({
        where: { id: currentMember.id },
        data: { role: "ADMIN" },
      })
      await tx.userOrganization.update({
        where: { id: targetMemberId },
        data: { role: "OWNER" },
      })
    })

    // AUDIT_POINT: OWNER_TRANSFERRED — { fromUserId: membership.userId, toUserId: target.userId }

    revalidatePath("/dashboard/settings/team")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to transfer ownership" }
  }
}
