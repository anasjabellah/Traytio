import { NextResponse } from 'next/server'
import { getCurrentMembership } from '@/lib/assert-role'

export async function GET() {
  try {
    const membership = await getCurrentMembership()
    return NextResponse.json({
      role: membership.role,
      organizationId: membership.organizationId,
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
