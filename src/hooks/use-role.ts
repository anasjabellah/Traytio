'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { PERMISSIONS, type Module, type Action } from '@/lib/permissions'
import type { OrgRole } from '@prisma/client'

type RoleResponse = {
  role: OrgRole
  organizationId: string
}

export function useRole() {
  const { user, isLoaded } = useUser()
  const [role, setRole] = useState<OrgRole | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const userId = user?.id ?? null

  useEffect(() => {
    if (!isLoaded) return

    if (!userId) {
      setRole(null)
      setOrganizationId(null)
      setLoading(false)
      return
    }

    fetch('/api/user-role')
      .then(r => r.json())
      .then((data: RoleResponse) => {
        setRole(data.role)
        setOrganizationId(data.organizationId)
      })
      .catch(() => {
        setRole(null)
        setOrganizationId(null)
      })
      .finally(() => setLoading(false))
  }, [isLoaded, userId])

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
