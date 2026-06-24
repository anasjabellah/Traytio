'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRole } from '@/hooks/use-role'
import type { Module, Action } from '@/lib/permissions'

type Props = {
  module: Module
  action: Action
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PageGuard({ module, action, children, fallback }: Props) {
  const router = useRouter()
  const { can, loading } = useRole()

  useEffect(() => {
    if (!loading && !can(module, action)) {
      router.replace('/dashboard/access-denied')
    }
  }, [loading, can, module, action, router])

  if (loading) return null
  if (!can(module, action)) return fallback ?? null
  return <>{children}</>
}
