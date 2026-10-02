import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { Webhook } from 'svix'
import { OrgRole, Prisma } from '@prisma/client'
import { linkPendingClaimToClerkUser, getPurchaseClaimByToken } from '@/features/billing/lib/provisioning'

/**
 * Internal control-flow error used to abort the user.deleted transaction when
 * the user is the sole OWNER of one or more organizations. Deleting that
 * membership would leave the organization(s) ownerless — no other member exists
 * to promote, and the schema has no isActive/deletedAt field to deactivate the
 * user instead (b15). The organization and all of its business/financial data
 * must survive, so the local user is intentionally kept (acknowledged, no-op).
 */
class LastOwnerBlockedError extends Error {
  readonly organizationIds: string[]

  constructor(organizationIds: string[]) {
    super(`user is the sole OWNER of organization(s): ${organizationIds.join(', ')}`)
    this.name = 'LastOwnerBlockedError'
    this.organizationIds = organizationIds
  }
}

/**
 * Purchase-claim evidence (Gap C guard, Phase 3). The sign-up page passes
 * the server-validated purchase token through Clerk's unsafeMetadata — the
 * ONLY channel linking this user.created delivery to a PurchaseClaim.
 * unsafeMetadata is client-controllable, so it can only ever BLOCK default
 * provisioning (fail closed); it never grants, consumes, or links anything.
 * Returns the token string, or null when no purchase evidence is present
 * (team-invitation signups and unrelated creations are untagged).
 */
function purchaseTokenEvidence(data: unknown): string | null {
  const meta = (data as { unsafe_metadata?: unknown } | null | undefined)?.unsafe_metadata
  if (typeof meta !== 'object' || meta === null) return null
  const token = (meta as Record<string, unknown>).traytioPurchaseToken
  if (typeof token !== 'string') return null
  const trimmed = token.trim()
  return trimmed.length > 0 && trimmed.length <= 512 ? trimmed : null
}

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

    // Phase 3A — paid-customer claim: if this email owns a pending purchase
    // tenant, swap the placeholder clerkId for the real identity and consume
    // the purchase token atomically. Org, OWNER membership, and subscription
    // are preserved; no second tenant is created.
    try {
      const linked = await linkPendingClaimToClerkUser({ clerkId: id, email })
      if (linked === 'claimed') {
        return new Response('OK', { status: 200 })
      }
      if (linked === 'email-taken') {
        // Address belongs to a real Clerk account (dedicated
        // existing-customer flow later). Leave everything unchanged instead
        // of failing into a 500-retry loop.
        console.warn(
          `[clerk-webhook] user.created: email already linked to a real account; leaving unchanged (no duplicate user)`,
        )
        return new Response('OK', { status: 200 })
      }
    } catch (err) {
      console.error(
        `[clerk-webhook] purchase claim failed: event=${evt.type} errorType=${err instanceof Error ? err.constructor.name : typeof err}`,
      )
      return new Response('Failed to link purchase claim', { status: 500 })
    }

    // Phase 3 — purchase-claim email mismatch guard (Gap C).
    // linkPendingClaimToClerkUser returned 'none': either this signup has
    // nothing to do with a purchase, or it carries purchase evidence but the
    // claim did not link (Clerk email ≠ claim email, or the claim lapsed
    // mid-flow). Default-provisioning in that second case would create a
    // stray free tenant — refuse it. Nothing is written, the PurchaseClaim
    // stays untouched (still reusable until its normal expiry/consumption),
    // and the event is acknowledged with 200 so Svix never retries and no
    // duplicate processing occurs. Email comparison is case-insensitive and
    // normalized exactly like the consumption logic in
    // linkPendingClaimToClerkUser (trim + lowercase).
    const evidence = purchaseTokenEvidence(evt.data)
    if (evidence) {
      let reason = 'lookup-error'
      try {
        const claim = await getPurchaseClaimByToken(evidence)
        if (claim.valid) {
          reason =
            claim.claim.email.trim().toLowerCase() === email.trim().toLowerCase()
              ? 'unlinked-match'
              : 'email-mismatch'
        } else {
          reason = claim.reason
        }
      } catch {
        reason = 'lookup-error'
      }
      console.warn(
        `[clerk-webhook] user.created: purchase-token evidence present (${reason}); refusing default provisioning clerkId=${id ?? 'unknown'}`,
      )
      return new Response('OK', { status: 200 })
    }

    // No purchase evidence (e.g. team-invitation signups): default
    // provisioning runs exactly as before — transactional User + Org + OWNER.
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
  } else if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data
    const email = email_addresses?.[0]?.email_address ?? ''

    // Sync local profile fields from Clerk. Idempotent: repeated writes with
    // the same data are harmless no-ops.
    try {
      const result = await prisma.user.updateMany({
        where: { clerkId: id },
        data: {
          email,
          firstName: first_name ?? null,
          lastName: last_name ?? null,
        },
      })

      if (result.count === 0) {
        // User does not exist locally (orphaned Clerk event / pre-provision
        // timing issue). Return 200 to prevent Clerk from retrying a
        // non-actionable event.
        console.warn(
          `[clerk-webhook] user.updated: no local user found for clerkId=${id ?? "unknown"} — event acknowledged but not applied`,
        )
      }
    } catch (err) {
      console.error(
        `[clerk-webhook] user.updated failed: clerkId=${id ?? "unknown"} errorType=${err instanceof Error ? err.constructor.name : typeof err}`,
      )
      return new Response('Failed to update user', { status: 500 })
    }
  } else if (evt.type === 'user.deleted') {
    // Clerk's user.deleted payload carries only the user id — all profile fields
    // are already gone. We use ONLY that id; no email, no client-provided org or
    // role is ever trusted here.
    const { id: clerkId } = evt.data

    const localUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })

    if (!localUser) {
      // Idempotent: repeated delivery after a successful delete, or an unknown
      // Clerk id (orphan / pre-provision event). Acknowledge; never create a
      // user and never touch organization or business data.
      console.warn(
        `[clerk-webhook] user.deleted: no local user found for clerkId=${clerkId ?? "unknown"} — event acknowledged but not applied`,
      )
      return new Response('OK', { status: 200 })
    }

    try {
      await prisma.$transaction(
        async (tx) => {
          // Read memberships INSIDE the transaction so every ownership decision
          // is based on transaction-consistent data (safe under concurrent
          // deliveries of sibling user.deleted events).
          const memberships = await tx.userOrganization.findMany({
            where: { userId: localUser.id },
            select: { id: true, organizationId: true, role: true, createdAt: true },
          })

          if (memberships.length === 0) {
            await tx.user.delete({ where: { id: localUser.id } })
            return
          }

          const rank: Record<OrgRole, number> = {
            SUPERADMIN: 4,
            OWNER: 3,
            ADMIN: 2,
            MEMBER: 1,
          }

          const dangerOrgIds: string[] = []
          const promotions: { organizationId: string; targetId: string }[] = []

          for (const membership of memberships) {
            if (membership.role !== 'OWNER') continue

            const others = await tx.userOrganization.findMany({
              where: { organizationId: membership.organizationId, userId: { not: localUser.id } },
              select: { id: true, role: true, createdAt: true },
            })

            // Sole OWNER: no candidate exists to take over. Deleting the
            // membership would remove the last OWNER — a hard invariant (mirrors
            // the team remove-member guard). Kept safe below by aborting.
            if (others.length === 0) {
              dangerOrgIds.push(membership.organizationId)
              continue
            }

            // Another OWNER stays behind → nothing to do for this org.
            if (others.some((o) => o.role === 'OWNER')) continue

            // Deterministic takeover: highest privilege first, earliest member
            // as tie-break, so the org always retains exactly one OWNER.
            const candidate = [...others].sort((a, b) => {
              const diff = rank[b.role] - rank[a.role]
              return diff !== 0 ? diff : a.createdAt.getTime() - b.createdAt.getTime()
            })[0]

            promotions.push({ organizationId: membership.organizationId, targetId: candidate.id })
          }

          if (dangerOrgIds.length > 0) {
            throw new LastOwnerBlockedError(dangerOrgIds)
          }

          for (const p of promotions) {
            await tx.userOrganization.update({
              where: { id: p.targetId, organizationId: p.organizationId },
              data: { role: 'OWNER' },
            })
          }

          // Safe by construction: user_organizations cascade (memberships only),
          // commande.createdById is SetNull, no other FK touches the user row.
          // Organizations, clients, commandes, invoices, payments and activity
          // history all survive untouched.
          await tx.user.delete({ where: { id: localUser.id } })
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )

      console.info(
        `[clerk-webhook] user.deleted: removed local user clerkId=${clerkId} — memberships cascaded, commande.createdById set to null, organizations and business records preserved`,
      )
      return new Response('OK', { status: 200 })
    } catch (err) {
      if (err instanceof LastOwnerBlockedError) {
        console.warn(
          `[clerk-webhook] user.deleted: kept local user clerkId=${clerkId} — sole OWNER of organization(s) ${err.organizationIds.join(', ')}; deletion would leave them without an owner. No safe deletion is possible without an isActive/deletedAt field (product/schema decision).`,
        )
        // Deliberately 200: the event is handled (no-op) and must not retry.
        return new Response('OK', { status: 200 })
      }
      console.error(
        `[clerk-webhook] user.deleted failed: clerkId=${clerkId ?? "unknown"} errorType=${err instanceof Error ? err.constructor.name : typeof err}`,
      )
      return new Response('Failed to delete user', { status: 500 })
    }
  }

  return new Response('OK', { status: 200 })
}
