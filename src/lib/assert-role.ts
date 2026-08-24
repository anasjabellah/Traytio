import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { PERMISSIONS, type Module, type Action } from '@/lib/permissions'
import type { OrgRole } from '@prisma/client'

export type Membership = {
  organizationId: string
  role: OrgRole
  userId: string
}

// Deterministic, privilege-favoring ordering used only when no explicit
// active-organization context is available for a multi-org user.
const ROLE_RANK: Record<OrgRole, number> = {
  SUPERADMIN: 4,
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
}

/**
 * Resolve the authenticated user's ACTIVE organization membership.
 *
 * Resolution order — NEVER an arbitrary "oldest"/"first" selection:
 *
 *  1. An explicit, server-provided `organizationId` is accepted ONLY after it is
 *     verified to be one of the user's actual memberships. Untrusted client
 *     input (query string, request body, hidden fields, localStorage, headers)
 *     must never be passed here — callers that pass it get a 403 if the user is
 *     not actually a member of that org.
 *  2. Clerk's active organization (`auth().orgId`) is used when it maps to a
 *     local membership. In the current schema the app provisions its OWN
 *     organizations on `user.created` and stores no Clerk-org ↔ app-org
 *     mapping, so `orgId` is normally null/unmappable and is simply ignored —
 *     it never causes a false denial.
 *  3. Exactly ONE membership -> that one (unambiguous, safe).
 *  4. MULTIPLE memberships with no explicit active-org context -> a
 *     deterministic, privilege-favoring selection
 *     (SUPERADMIN > OWNER > ADMIN > MEMBER, most-recent `createdAt` as a
 *     tie-break). This is a deliberate safe default, NOT a silent "oldest
 *     membership" pick, and keeps single-org users and superadmins working
 *     without an org switcher.
 *
 * Cross-tenant safety: any supplied organizationId is always re-verified
 * against the user's real memberships, so a user can never authorize against a
 * tenant they do not belong to.
 */
export const getCurrentMembership = cache(async (
  organizationId?: string,
): Promise<Membership> => {
  const { userId: clerkId, orgId: clerkOrgId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  // 1. Explicit server-provided active org — verify membership first.
  if (organizationId) {
    const verified = await findVerifiedMembership(clerkId, organizationId)
    if (!verified) {
      throw new Error('Forbidden: you do not belong to this organization')
    }
    return strip(verified)
  }

  // 2. Clerk active organization — only when it maps to a local membership.
  if (clerkOrgId) {
    const verified = await findVerifiedMembership(clerkId, clerkOrgId)
    if (verified) return strip(verified)
    // Not mapped (no Clerk-org ↔ app-org link) -> fall through safely.
  }

  // 3/4. No explicit active-org context: resolve deterministically.
  const memberships = await prisma.userOrganization.findMany({
    where: { user: { clerkId } },
    select: {
      organizationId: true,
      role: true,
      userId: true,
      createdAt: true,
    },
  })

  if (memberships.length === 0) {
    throw new Error('Organization not found')
  }

  if (memberships.length === 1) {
    return strip(memberships[0])
  }

  const chosen = [...memberships].sort((a, b) => {
    const rankDiff = ROLE_RANK[b.role] - ROLE_RANK[a.role]
    if (rankDiff !== 0) return rankDiff
    return b.createdAt.getTime() - a.createdAt.getTime()
  })[0]

  return strip(chosen)
})

async function findVerifiedMembership(clerkId: string, organizationId: string) {
  return prisma.userOrganization.findFirst({
    where: { user: { clerkId }, organizationId },
    select: {
      organizationId: true,
      role: true,
      userId: true,
      createdAt: true,
    },
  })
}

function strip(m: {
  organizationId: string
  role: OrgRole
  userId: string
  createdAt: Date
}): Membership {
  return { organizationId: m.organizationId, role: m.role, userId: m.userId }
}

export async function assertCan(
  module: Module,
  action: Action,
  ownerId?: string,
): Promise<OrgRole> {
  const membership = await getCurrentMembership()

  if (membership.role === 'SUPERADMIN') {
    return 'SUPERADMIN'
  }

  const allowed = PERMISSIONS[module]?.[action]

  if (!allowed) {
    throw new Error(`Forbidden: no permission defined for ${action} on ${module}`)
  }

  if (!allowed.includes(membership.role)) {
    throw new Error(`Forbidden: ${membership.role} cannot ${action} ${module}`)
  }

  if (membership.role === 'MEMBER' && ownerId !== undefined && ownerId !== membership.userId) {
    throw new Error(`Forbidden: MEMBER cannot ${action} ${module} they do not own`)
  }

  return membership.role
}
