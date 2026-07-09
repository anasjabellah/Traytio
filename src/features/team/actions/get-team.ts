"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentMembership } from "@/lib/assert-role"
import { AUTH } from "@/lib/notify/messages"
import { PERMISSIONS } from "@/lib/permissions"

export async function getTeam() {
  try {
    const membership = await getCurrentMembership()

    const allowed = PERMISSIONS.team?.view
    if (!allowed?.includes(membership.role)) {
      throw new Error(AUTH.FORBIDDEN_VIEW_TEAM)
    }

    const [members, invitations] = await Promise.all([
      prisma.userOrganization.findMany({
        where: { organizationId: membership.organizationId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.invitation.findMany({
        where: { organizationId: membership.organizationId },
        orderBy: { createdAt: "desc" },
      }),
    ])

    const serializedMembers = members
      .filter((m): m is typeof m & { user: NonNullable<typeof m.user> } => m.user !== null)
      .map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
        user: {
          firstName: m.user.firstName,
          lastName: m.user.lastName,
          email: m.user.email,
          imageUrl: m.user.imageUrl,
          createdAt: m.user.createdAt.toISOString(),
        },
      }))

    const serializedInvitations = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      token: inv.token,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
    }))

    return { success: true, data: { members: serializedMembers, invitations: serializedInvitations } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : AUTH.FETCH_ERROR }
  }
}
