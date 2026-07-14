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
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: AUTH.SESSION.UNAUTHORIZED }, { status: 401 })
    }
    if (message === 'Organization not found') {
      return NextResponse.json({ error: AUTH.ORGANIZATION_NOT_FOUND }, { status: 404 })
    }
    return NextResponse.json({ error: AUTH.SESSION.UNAUTHORIZED }, { status: 500 })
  }
}
