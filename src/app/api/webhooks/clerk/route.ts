import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { Webhook } from 'svix'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) return new Response('Missing webhook secret', { status: 400 })

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    return new Response('Invalid webhook signature', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data
    const email = email_addresses?.[0]?.email_address ?? ''
    const name = `${first_name ?? ''} ${last_name ?? ''}`.trim() || email

    const user = await prisma.user.create({
      data: {
        clerkId: id,
        email,
        firstName: first_name ?? null,
        lastName: last_name ?? null,
      }
    })

    const org = await prisma.organization.create({
      data: {
        name: `${name}'s Organisation`,
        slug: `org-${id.slice(0, 8)}-${Date.now()}`,
        email,
      }
    })

    await prisma.userOrganization.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: 'OWNER',
      }
    })
  }

  return new Response('OK', { status: 200 })
}
