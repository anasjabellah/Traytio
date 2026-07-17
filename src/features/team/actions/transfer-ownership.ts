"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { AUTH } from "@/lib/notify/messages"
import { normalizeActionError } from "@/lib/action-error"
import { OrgRole } from "@prisma/client"
import { withActionGuard } from "@/lib/action-guard"
import { revalidatePath } from "next/cache"

const transferOwnershipSchema = z.object({
  targetMemberId: z.string().min(1),
})

async function transferOwnershipHandler(targetMemberId: string) {
  try {
    const parsed = transferOwnershipSchema.safeParse({ targetMemberId })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? AUTH.OWNERSHIP.TRANSFER_ERROR }
    }

    const membership = await getCurrentMembership()
    await assertCan("team", "change-role")

    if (membership.role !== "OWNER") {
      return { success: false, error: AUTH.OWNERSHIP.ONLY_OWNER_CAN_TRANSFER }
    }

    const [target, currentMember] = await Promise.all([
      prisma.userOrganization.findUnique({ where: { id: targetMemberId } }),
      prisma.userOrganization.findFirst({
        where: { userId: membership.userId, organizationId: membership.organizationId },
      }),
    ])

    if (!target || target.organizationId !== membership.organizationId) {
      return { success: false, error: AUTH.MEMBER.NOT_FOUND }
    }

    if (target.role !== "ADMIN") {
      return { success: false, error: AUTH.OWNERSHIP.TRANSFER_TO_ADMIN_ONLY }
    }

    if (target.userId === membership.userId) {
      return { success: false, error: AUTH.OWNERSHIP.ALREADY_OWNER }
    }

    if (!currentMember) {
      return { success: false, error: AUTH.MEMBER.NOT_FOUND }
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
    return { success: false, error: normalizeActionError(err, AUTH.OWNERSHIP.TRANSFER_ERROR) }
  }
}

export const transferOwnership = withActionGuard(transferOwnershipHandler, { name: 'team:change-role' })
