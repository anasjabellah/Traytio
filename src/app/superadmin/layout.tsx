import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SuperadminTopBar } from './superadmin-nav'

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  // SUPERADMIN is effectively user-level: grant access if the user holds the
  // SUPERADMIN role in ANY of their organizations (never rely on an arbitrary
  // "first" membership, which could wrongly block a multi-org superadmin).
  const membership = await prisma.userOrganization.findFirst({
    where: { user: { clerkId }, role: 'SUPERADMIN' },
    select: { role: true },
  })

  if (membership?.role !== 'SUPERADMIN') {
    redirect('/dashboard')
  }

  return (
    <>
      <SuperadminTopBar />
      {children}
    </>
  )
}
