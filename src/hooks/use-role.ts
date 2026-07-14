'use client'

import { useUser } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'
import { PERMISSIONS, type Module, type Action } from '@/lib/permissions'
import type { OrgRole } from '@prisma/client'

type RoleResponse = {
  role: OrgRole
  organizationId: string
}

const ROLE_QUERY_KEY = 'user-role'

export function useRole() {
  const { user, isLoaded } = useUser()
  const userId = user?.id ?? null

  const { data, isPending } = useQuery({
    queryKey: [ROLE_QUERY_KEY, userId],
    queryFn: async () => {
      const res = await fetch('/api/user-role')
      if (!res.ok) throw new Error('Unauthorized')
      return res.json() as Promise<RoleResponse>
    },
    enabled: isLoaded && !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    gcTime: 10 * 60 * 1000,
  })

  const role = data?.role ?? null
  const organizationId = data?.organizationId ?? null
  const loading = !isLoaded || (!!userId && isPending)

  const can = (module: Module, action: Action): boolean => {
    if (!role) return false
    const allowed = PERMISSIONS[module]?.[action]
    return allowed?.includes(role) ?? false
  }

  const isAdmin = role === 'OWNER' || role === 'ADMIN'
  const isOwner = role === 'OWNER'
  const isMember = role === 'MEMBER'

  return { role, organizationId, loading, can, isAdmin, isOwner, isMember }
}
