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

export const getCurrentMembership = cache(async (): Promise<Membership> => {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const result = await prisma.userOrganization.findFirst({
    where: { user: { clerkId } },
    orderBy: { createdAt: 'asc' },
    select: { organizationId: true, role: true, userId: true },
  })

  if (!result) throw new Error('Organization not found')
  return {
    organizationId: result.organizationId,
    role: result.role,
    userId: result.userId,
  }
})

export async function assertCan(
  module: Module,
  action: Action,
  ownerId?: string,
): Promise<OrgRole> {
  const membership = await getCurrentMembership()
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
