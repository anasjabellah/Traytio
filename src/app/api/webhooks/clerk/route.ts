import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { Webhook } from 'svix'
import { OrgRole, Prisma } from '@prisma/client'

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

  // Pre-read protection: reject oversized declared request bodies before
  // buffering. Chunked requests without Content-Length are not blocked here
  // (Svix must still read the body to verify), so this is defense-in-depth only.
  const declaredLength = Number(req.headers.get("content-length") || 0)
  const MAX_WEBHOOK_BYTES = 1 * 1024 * 1024
  if (declaredLength > MAX_WEBHOOK_BYTES) {
    return new Response("Request body too large", { status: 413 })
  }

  const body = await req.text()

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
    const displayName = `${first_name ?? ''} ${last_name ?? ''}`.trim()
    const orgName = displayName.length > 0
      ? `${displayName}'s Organisation`
      : 'Mon Organisation'

    // Idempotency: if this Clerk user was already provisioned, skip silently.
    const existing = await prisma.user.findUnique({ where: { clerkId: id } })
    if (existing) {
      return new Response('OK', { status: 200 })
    }

    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            clerkId: id,
            email,
            firstName: first_name ?? null,
            lastName: last_name ?? null,
          },
        })

        const org = await tx.organization.create({
          data: {
            name: orgName,
            slug: `org-${id.slice(0, 8)}-${Date.now()}`,
            email,
          },
        })

        await tx.userOrganization.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            role: OrgRole.OWNER,
          },
        })
      })
    } catch (err) {
      // A duplicate delivery that raced past the idempotency check still hits the
      // unique constraint — treat it as a harmless retry, not a failure.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return new Response('OK', { status: 200 })
      }
      console.error(
        `[clerk-webhook] user.created failed: event=${evt.type} clerkId=${id ?? "unknown"} errorType=${err instanceof Error ? err.constructor.name : typeof err}`,
      )
      return new Response('Failed to create user resources', { status: 500 })
    }
  }

  return new Response('OK', { status: 200 })
}
