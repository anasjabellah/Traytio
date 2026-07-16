"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentMembership } from "@/lib/assert-role"
import { AUTH } from "@/lib/notify/messages"
import { withActionGuard } from "@/lib/action-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { buildMonthKeys, buildMonthlySparkline } from "@/features/dashboard/lib/kpi-engine"
import type { TeamStats, TeamPagination } from "@/features/team/types"

const TEAM_DEFAULT_PAGE_SIZE = 20

async function getTeamHandler(params?: { page?: number; limit?: number }) {
  try {
    const membership = await getCurrentMembership()

    const allowed = PERMISSIONS.team?.view
    if (!allowed?.includes(membership.role)) {
      throw new Error(AUTH.FORBIDDEN_VIEW_TEAM)
    }

    const page = Math.max(1, params?.page ?? 1)
    const limit = Math.max(1, Math.min(100, params?.limit ?? TEAM_DEFAULT_PAGE_SIZE))
    const skip = (page - 1) * limit

    const [total, members, invitations] = await Promise.all([
      prisma.userOrganization.count({
        where: { organizationId: membership.organizationId },
      }),
      prisma.userOrganization.findMany({
        where: { organizationId: membership.organizationId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
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

    const monthKeys = buildMonthKeys(8)
    const historicalStart = new Date()
    historicalStart.setMonth(historicalStart.getMonth() - 8)

    const historicalMembers = await prisma.userOrganization.findMany({
      where: {
        organizationId: membership.organizationId,
        createdAt: { gte: historicalStart },
      },
      select: { createdAt: true, role: true },
    })

    const historicalInvitations = await prisma.invitation.findMany({
      where: {
        organizationId: membership.organizationId,
        createdAt: { gte: historicalStart },
      },
      select: { createdAt: true },
    })

    const stats: TeamStats = {
      totalMembers: serializedMembers.length,
      activeMembers: serializedMembers.length,
      pendingInvitations: serializedInvitations.length,
      adminCount: serializedMembers.filter((m) => m.role === 'ADMIN').length,
      perfTotal: buildMonthlySparkline(historicalMembers, monthKeys),
      perfActive: buildMonthlySparkline(historicalMembers, monthKeys),
      perfInvites: buildMonthlySparkline(historicalInvitations, monthKeys),
      perfAdmins: buildMonthlySparkline(
        historicalMembers.filter((m) => m.role === 'ADMIN'),
        monthKeys,
      ),
    }

    const totalPages = Math.ceil(total / limit)
    const pagination: TeamPagination = { page, limit, total, totalPages }

    return { success: true, data: { members: serializedMembers, invitations: serializedInvitations, stats, pagination } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : AUTH.FETCH_ERROR }
  }
}

export const getTeam = withActionGuard(getTeamHandler, { name: 'team:read' })
