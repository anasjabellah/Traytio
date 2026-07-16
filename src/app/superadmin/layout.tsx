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

  const membership = await prisma.userOrganization.findFirst({
    where: { user: { clerkId } },
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
