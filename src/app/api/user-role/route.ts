import { NextResponse } from 'next/server'
import { getCurrentMembership } from '@/lib/assert-role'
import { AUTH } from '@/lib/notify/messages'

export async function GET() {
  try {
    const membership = await getCurrentMembership()
    return NextResponse.json({
      role: membership.role,
      organizationId: membership.organizationId,
    })
  } catch {
    return NextResponse.json({ error: AUTH.SESSION.UNAUTHORIZED }, { status: 401 })
  }
}
