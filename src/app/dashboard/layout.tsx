import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from './layout-client'
import {
  requireActiveSubscription,
  SubscriptionRequiredError,
} from '@/features/billing/lib/billing'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // P0 SaaS enforcement: the whole dashboard requires an entitled
  // organization. Inactive orgs land on /billing (outside this layout, so
  // no redirect loop) where they can subscribe. Auth failures propagate.
  try {
    await requireActiveSubscription()
  } catch (err: unknown) {
    if (err instanceof SubscriptionRequiredError) redirect('/billing')
    throw err
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}