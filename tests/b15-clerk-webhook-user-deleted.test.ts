/**
 * B-15 Clerk Webhook — user.deleted safe cleanup — Unit Tests
 *
 * Finding H-1 (auth/security audit): the Clerk webhook (src/app/api/webhooks/
 * clerk/route.ts) handled user.created and user.updated but not user.deleted,
 * leaving the local Traytio User and its memberships behind after a Clerk
 * account was deleted.
 *
 * Fix: an else-if branch on evt.type === 'user.deleted' removes the local User
 * inside a Serializable transaction. Prisma-side relations make this safe:
 *   - user_organizations.userId          onDelete: Cascade  (memberships only)
 *   - commande.createdById               onDelete: SetNull  (business rows kept)
 *   - commande_activities.userId         plain column, no FK  (history kept)
 * No other relation references User.id, so Organizations and every
 * business/financial record survive the delete.
 *
 * Ownership invariants (mirroring the team remove-member guard) are enforced:
 *   - if the user is the sole OWNER of an organization (no other member to
 *     promote), the local User is KEPT and the event is acknowledged with
 *     200 — the schema has no isActive/deletedAt field to deactivate instead
 *     (product/schema decision, see bottom of this file).
 *   - if another OWNER exists, nothing is promoted.
 *   - otherwise the highest-privilege (then earliest-joined) remaining member
 *     is promoted to OWNER before deletion so the org always retains an owner.
 * User.deleted uses ONLY evt.data.id — no email, no client org/role is trusted.
 * Unknown clerkId → 200 (acknowledged, not applied). DB errors → 500 (Clerk
 * retries). The request/response surface is unchanged (Svix verification, body
 * size cap, secret requirements) and no sensitive value is ever echoed.
 *
 * Test convention: faithful replicas of the new handler logic (truth-table
 * tests) + fs contract checks on the actual source tree (no transitive deps),
 * same style as tests/b14-*.
 *
 * Run: npx tsx tests/b15-clerk-webhook-user-deleted.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function readProjectFile(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

// ── Handler replica: faithful to the user.deleted implementation ──

type OrgRoleSim = 'OWNER' | 'ADMIN' | 'MEMBER' | 'SUPERADMIN'

type MembershipSim = {
  id: string
  userId: string
  organizationId: string
  role: OrgRoleSim
  createdAt: number
}

type StoredUserSim = {
  clerkId: string
  userId: string
  memberships: MembershipSim[]
}

/** commande.createdById stand-in: business rows that must survive deletion. */
type CommandeAuthorSim = {
  id: string
  organizationId: string
  authorUserId: string | null
}

type SimStore = {
  users: Map<string, StoredUserSim> // keyed by clerkId
  organizations: Set<string> // organizations — must never be removed
  commandeAuthors: CommandeAuthorSim[]
}

type Outcome =
  | { outcome: 'noop' }
  | { outcome: 'deleted'; promoted: { organizationId: string; targetUserId: string }[] }
  | { outcome: 'kept'; organizationIds: string[] }

const simRank: Record<OrgRoleSim, number> = {
  SUPERADMIN: 4,
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
}

function allMemberships(store: SimStore): MembershipSim[] {
  return [...store.users.values()].flatMap((u) => u.memberships)
}

function membershipsOfOrganization(store: SimStore, organizationId: string): MembershipSim[] {
  return allMemberships(store).filter((m) => m.organizationId === organizationId)
}

/**
 * Mirrors the user.deleted branch. Mutates `store` only when the replicated
 * transaction commits (promotions + user delete are applied together). Pass
 * `throwOnApply` to simulate a DB failure inside the transaction: nothing may
 * be mutated, mirroring the real rollback and the resulting 500 + Clerk retry.
 */
function simulateUserDeleted(
  store: SimStore,
  clerkId: string,
  opts?: { throwOnApply?: boolean },
): Outcome {
  const user = store.users.get(clerkId)
  if (!user) return { outcome: 'noop' }

  const dangerOrgIds: string[] = []
  const promotions: { organizationId: string; targetUserId: string }[] = []

  for (const m of user.memberships) {
    if (m.role !== 'OWNER') continue

    const others = membershipsOfOrganization(store, m.organizationId).filter(
      (x) => x.userId !== user.userId,
    )

    if (others.length === 0) {
      dangerOrgIds.push(m.organizationId)
      continue
    }

    if (others.some((o) => o.role === 'OWNER')) continue

    const candidate = [...others].sort((a, b) => {
      const diff = simRank[b.role] - simRank[a.role]
      return diff !== 0 ? diff : a.createdAt - b.createdAt
    })[0]

    promotions.push({ organizationId: m.organizationId, targetUserId: candidate.userId })
  }

  if (dangerOrgIds.length > 0) {
    return { outcome: 'kept', organizationIds: dangerOrgIds }
  }

  if (opts?.throwOnApply) {
    throw new Error('simulated DB failure inside transaction')
  }

  for (const p of promotions) {
    const target = [...store.users.values()].find((u) => {
      return u.memberships.some(
        (mm) => mm.organizationId === p.organizationId && mm.userId === p.targetUserId,
      )
    })!
    const membership = target.memberships.find(
      (mm) => mm.organizationId === p.organizationId,
    )!
    membership.role = 'OWNER'
  }

  for (const ca of store.commandeAuthors) {
    if (ca.authorUserId === user.userId) ca.authorUserId = null
  }
  store.users.delete(clerkId)

  return { outcome: 'deleted', promoted: promotions }
}

// Shared fixture helpers

function userMemberships(...items: Array<{ organizationId: string; role: OrgRoleSim; createdAt?: number }>): Array<Omit<MembershipSim, 'userId'>> {
  return items.map((it, i) => ({
    id: `ms_${it.organizationId}_${i}`,
    organizationId: it.organizationId,
    role: it.role,
    createdAt: it.createdAt ?? 10,
  }))
}

function makeStore(
  users: Array<{ clerkId: string; userId: string; memberships: Array<Omit<MembershipSim, 'userId'>> }>,
  commandeAuthors: CommandeAuthorSim[] = [],
): SimStore {
  const store: SimStore = {
    users: new Map(),
    organizations: new Set(),
    commandeAuthors,
  }
  for (const u of users) {
    store.users.set(u.clerkId, {
      ...u,
      memberships: u.memberships.map((m) => ({ ...m, userId: u.userId })),
    })
  }
  for (const u of users) {
    for (const m of u.memberships) store.organizations.add(m.organizationId)
  }
  return store
}

// ── Tests ──

describe('B-15 user.deleted removes an existing local user safely', () => {
  it('deletes a MEMBER whose org has a separate owner (org + owner survive)', () => {
    const store = makeStore([
      { clerkId: 'owner1', userId: 'u_owner1', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER' }) },
      { clerkId: 'member1', userId: 'u_member1', memberships: userMemberships({ organizationId: 'org_1', role: 'MEMBER' }) },
    ], [
      { id: 'c1', organizationId: 'org_1', authorUserId: 'u_member1' },
    ])

    const result = simulateUserDeleted(store, 'member1')

    assert.equal(result.outcome, 'deleted')
    assert.deepEqual(result.promoted, [])
    assert.equal(store.users.has('member1'), false, 'deleted user must be removed')
    assert.equal(store.users.get('owner1')?.memberships.some((m) => m.organizationId === 'org_1'), true, 'owner membership must survive')
    assert.equal(store.organizations.has('org_1'), true, 'org must survive')
    assert.equal(store.commandeAuthors[0].authorUserId, null, 'commande.createdById must be set null')
    assert.ok(store.commandeAuthors.some((ca) => ca.id === 'c1'), 'business row must survive')
  })

  it('deletes an OWNER when another OWNER exists (no promotion needed)', () => {
    const store = makeStore([
      { clerkId: 'ownerA', userId: 'u_ownerA', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER' }) },
      { clerkId: 'ownerB', userId: 'u_ownerB', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER' }) },
    ])

    const result = simulateUserDeleted(store, 'ownerB')

    assert.equal(result.outcome, 'deleted')
    assert.deepEqual(result.promoted, [])
    assert.equal(store.organizations.has('org_1'), true)
    assert.ok(store.users.has('ownerA'), 'the other owner must survive')
  })

  it('does not lose memberships of other users in the same org', () => {
    const store = makeStore([
      { clerkId: 'owner1', userId: 'u_owner1', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER' }) },
      { clerkId: 'admin1', userId: 'u_admin1', memberships: userMemberships({ organizationId: 'org_1', role: 'ADMIN', createdAt: 5 }) },
      { clerkId: 'member1', userId: 'u_member1', memberships: userMemberships({ organizationId: 'org_1', role: 'MEMBER' }) },
    ])
    const orgMembersBefore = membershipsOfOrganization(store, 'org_1').length

    simulateUserDeleted(store, 'member1')

    assert.equal(membershipsOfOrganization(store, 'org_1').length, orgMembersBefore - 1)
    assert.ok(store.users.has('owner1') && store.users.has('admin1'))
  })
})

describe('B-15 last-owner protection', () => {
  it('keeps the local user when they are the SOLE OWNER (no member available)', () => {
    const store = makeStore([
      { clerkId: 'solo', userId: 'u_solo', memberships: userMemberships({ organizationId: 'org_solo', role: 'OWNER' }) },
    ], [
      { id: 'c1', organizationId: 'org_solo', authorUserId: 'u_solo' },
    ])

    const result = simulateUserDeleted(store, 'solo')

    assert.equal(result.outcome, 'kept')
    assert.deepEqual(result.organizationIds, ['org_solo'])
    assert.ok(store.users.has('solo'), 'user must be kept')
    assert.equal(store.organizations.has('org_solo'), true)
    assert.equal(store.commandeAuthors[0].authorUserId, 'u_solo', 'no business attribution change when nothing is deleted')
  })

  it('promotes the highest-privilege remaining member when the user is the last OWNER', () => {
    const store = makeStore([
      { clerkId: 'owner1', userId: 'u_owner1', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER', createdAt: 1 }) },
      { clerkId: 'admin1', userId: 'u_admin1', memberships: userMemberships({ organizationId: 'org_1', role: 'ADMIN', createdAt: 2 }) },
      { clerkId: 'member1', userId: 'u_member1', memberships: userMemberships({ organizationId: 'org_1', role: 'MEMBER', createdAt: 3 }) },
    ])

    const result = simulateUserDeleted(store, 'owner1')

    assert.equal(result.outcome, 'deleted')
    assert.deepEqual(result.promoted, [{ organizationId: 'org_1', targetUserId: 'u_admin1' }])
    const adminMembership = store.users.get('admin1')!.memberships.find((m) => m.organizationId === 'org_1')!
    assert.equal(adminMembership.role, 'OWNER', 'ADMIN must be promoted to OWNER')
    assert.equal(store.users.has('owner1'), false)
    assert.ok(store.users.has('admin1') && store.users.has('member1'))
  })

  it('uses earliest-joined as tie-break between equal-privilege candidates', () => {
    const store = makeStore([
      { clerkId: 'owner1', userId: 'u_owner1', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER', createdAt: 1 }) },
      { clerkId: 'memA', userId: 'u_memA', memberships: userMemberships({ organizationId: 'org_1', role: 'MEMBER', createdAt: 10 }) },
      { clerkId: 'memB', userId: 'u_memB', memberships: userMemberships({ organizationId: 'org_1', role: 'MEMBER', createdAt: 20 }) },
    ])

    const result = simulateUserDeleted(store, 'owner1')

    assert.equal(result.outcome, 'deleted')
    assert.deepEqual(result.promoted, [{ organizationId: 'org_1', targetUserId: 'u_memA' }])
    assert.equal(store.users.get('memA')!.memberships.find((m) => m.organizationId === 'org_1')!.role, 'OWNER')
  })

  it('does not promote when another OWNER remains in the org', () => {
    const store = makeStore([
      { clerkId: 'ownerA', userId: 'u_ownerA', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER' }) },
      { clerkId: 'ownerB', userId: 'u_ownerB', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER' }) },
      { clerkId: 'admin1', userId: 'u_admin1', memberships: userMemberships({ organizationId: 'org_1', role: 'ADMIN' }) },
    ])

    const result = simulateUserDeleted(store, 'ownerB')

    assert.equal(result.outcome, 'deleted')
    assert.deepEqual(result.promoted, [], 'no promotion when an OWNER survives')
    assert.equal(store.users.get('admin1')!.memberships.find((m) => m.organizationId === 'org_1')!.role, 'ADMIN', 'ADMIN role untouched')
  })

  it('aborts across MULTIPLE orgs when one is sole-OWNED (kept, nothing partially applied)', () => {
    const store = makeStore([
      { clerkId: 'multi', userId: 'u_multi', memberships: userMemberships(
        { organizationId: 'org_safe', role: 'OWNER' },
        { organizationId: 'org_orphan', role: 'OWNER' },
      ) },
      { clerkId: 'admin1', userId: 'u_admin1', memberships: userMemberships({ organizationId: 'org_safe', role: 'ADMIN' }) },
    ])

    const result = simulateUserDeleted(store, 'multi')

    assert.equal(result.outcome, 'kept')
    assert.deepEqual(result.organizationIds, ['org_orphan'])
    assert.equal(store.users.has('multi'), true, 'user fully kept (transaction aborted)')
    const adminRole = store.users.get('admin1')!.memberships.find((m) => m.organizationId === 'org_safe')!.role
    assert.equal(adminRole, 'ADMIN', 'no promotion was applied alongside an aborted transaction')
  })
})

describe('B-15 idempotency and unknown clerkId', () => {
  it('unknown clerkId is a no-op and changes nothing', () => {
    const store = makeStore([
      { clerkId: 'owner1', userId: 'u_owner1', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER' }) },
    ])
    const before = { orgs: [...store.organizations], users: store.users.size }

    const result = simulateUserDeleted(store, 'user_unknown')

    assert.equal(result.outcome, 'noop')
    assert.equal(store.users.size, before.users, 'no user added or removed')
    assert.deepEqual([...store.organizations], before.orgs)
    assert.ok(store.users.has('owner1'), 'existing user untouched')
  })

  it('repeated delivery converges to a single deletion (idempotent)', () => {
    const store = makeStore([
      { clerkId: 'owner1', userId: 'u_owner1', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER' }) },
      { clerkId: 'member1', userId: 'u_member1', memberships: userMemberships({ organizationId: 'org_1', role: 'MEMBER' }) },
    ])
    const orgsAfterSingle = new Set(store.organizations)

    const first = simulateUserDeleted(store, 'member1')
    const second = simulateUserDeleted(store, 'member1')

    assert.equal(first.outcome, 'deleted')
    assert.equal(second.outcome, 'noop')
    assert.deepEqual([...store.organizations], [...orgsAfterSingle], 'orgs unchanged across deliveries')
    assert.equal(store.users.has('member1'), false)
  })
})

describe('B-15 organizations and business/financial records survive', () => {
  it('an organizations set is never shrunk by a user deletion', () => {
    const store = makeStore([
      { clerkId: 'owner1', userId: 'u_owner1', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER' }) },
      { clerkId: 'owner2', userId: 'u_owner2', memberships: userMemberships({ organizationId: 'org_2', role: 'OWNER' }) },
    ])
    const orgIds = [...store.organizations].sort()

    simulateUserDeleted(store, 'owner2')

    assert.deepEqual([...store.organizations].sort(), orgIds, 'all organizations remain')
  })

  it('business rows from OTHER authors are untouched by the deletion', () => {
    const store = makeStore([
      { clerkId: 'owner1', userId: 'u_owner1', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER' }) },
      { clerkId: 'member1', userId: 'u_member1', memberships: userMemberships({ organizationId: 'org_1', role: 'MEMBER' }) },
    ], [
      { id: 'mine', organizationId: 'org_1', authorUserId: 'u_member1' },
      { id: 'theirs', organizationId: 'org_1', authorUserId: 'u_owner1' },
    ])

    simulateUserDeleted(store, 'member1')

    const theirs = store.commandeAuthors.find((ca) => ca.id === 'theirs')!
    assert.equal(theirs.authorUserId, 'u_owner1', 'other authors are preserved')
    assert.equal(store.commandeAuthors.length, 2, 'no business row is removed')
  })

  it('commande activity history (plain userId column, no FK) is untouched', () => {
    // Contract: schema.prisma declares CommandeActivity.userId as a nullable
    // plain String with NO relation to User — the delete cannot touch it.
    const schema = readProjectFile('src/prisma/schema.prisma')
    assert.ok(
      /CommandeActivity \{[\s\S]*?userId\s+String\?/.test(schema),
      'CommandeActivity.userId must be a nullable plain column (no FK)',
    )
    const relationDef = schema.match(/CommandeActivity \{[\s\S]*?\n}/)?.[0] ?? ''
    assert.ok(
      !relationDef.includes('@relation') || relationDef.includes('commande Commande'),
      'CommandeActivity must not define a relation to User',
    )
  })
})

describe('B-15 transaction failure atomicity', () => {
  it('a DB failure inside the transaction leaves the store unmodified (rollback)', () => {
    const store = makeStore([
      { clerkId: 'owner1', userId: 'u_owner1', memberships: userMemberships({ organizationId: 'org_1', role: 'OWNER' }) },
      { clerkId: 'member1', userId: 'u_member1', memberships: userMemberships({ organizationId: 'org_1', role: 'MEMBER' }) },
    ])
    const orgMembersBefore = membershipsOfOrganization(store, 'org_1').length

    assert.throws(() => simulateUserDeleted(store, 'member1', { throwOnApply: true }), /simulated DB failure/)

    assert.ok(store.users.has('member1'), 'user not deleted on failure')
    assert.equal(membershipsOfOrganization(store, 'org_1').length, orgMembersBefore, 'memberships unchanged on failure')
  })
})

describe('B-15 source contract: route.ts implements the audit', () => {
  it('handles user.created (existing behavior preserved)', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    assert.ok(src.includes("evt.type === 'user.created'"), 'user.created handler must be present')
  })

  it('handles user.updated (existing behavior preserved)', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    assert.ok(src.includes("evt.type === 'user.updated'"), 'user.updated handler must be present')
  })

  it('handles user.deleted (new branch)', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    assert.ok(src.includes("evt.type === 'user.deleted'"), 'user.deleted handler must be present')
  })

  it('user.deleted uses ONLY evt.data.id — no email, no client org/role', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    const deletedStart = src.indexOf("evt.type === 'user.deleted'")
    const branch = src.slice(deletedStart)

    assert.ok(branch.includes('const { id: clerkId } = evt.data'), 'must read only id from the event')
    assert.equal(branch.includes('email_addresses'), false, 'must not read email from the event')
    assert.ok(branch.includes('organizationId'), 'only writes are scoped by server-read organizationId rows')
    // No client-supplied ids: the branch must never build a where clause from a
    // request/query/body — there is no request plumbing in this branch.
    assert.equal(branch.includes('req.'), false, 'must not touch the request object')
  })

  it('user.deleted is transactional and Serializable-safe', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    const branch = src.slice(src.indexOf("evt.type === 'user.deleted'"))
    assert.ok(branch.includes('prisma.$transaction('), 'delete must run in a transaction')
    assert.ok(
      branch.includes('isolationLevel: Prisma.TransactionIsolationLevel.Serializable'),
      'transaction must be Serializable (concurrent delivery safety)',
    )
  })

  it('reads memberships inside the transaction (owner decisions on tx-consistent data)', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    const branch = src.slice(src.indexOf("evt.type === 'user.deleted'"))
    const txBody = branch.slice(branch.indexOf('async (tx) =>'))
    assert.ok(txBody.includes('tx.userOrganization.findMany'), 'memberships read via the tx-client')
    assert.ok(txBody.includes('tx.user.delete'), 'user deleted via the tx-client')
  })

  it('blocks deleting a sole OWNER and acknowledges with 200', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    const branch = src.slice(src.indexOf("evt.type === 'user.deleted'"))
    assert.ok(branch.includes('LastOwnerBlockedError'), 'sole-owner abort class must be used')
    assert.ok(branch.includes('throw new LastOwnerBlockedError(dangerOrgIds)'), 'abort must be thrown before any write')
    assert.ok(branch.includes("return new Response('OK', { status: 200 })"), 'abort must acknowledge with 200 (no retry)')
  })

  it('never deletes an organization from user.deleted', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    const branch = src.slice(src.indexOf("evt.type === 'user.deleted'"))
    assert.equal(branch.includes('organization.delete'), false, 'orgs must never be deleted here')
    assert.equal(branch.includes('commande.delete') || branch.includes('invoice.delete'), false, 'business rows must never be deleted here')
  })

  it('scopes member-role promotions by organizationId (tenant-safe write)', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    const branch = src.slice(src.indexOf("evt.type === 'user.deleted'"))
    assert.ok(
      branch.includes('where: { id: p.targetId, organizationId: p.organizationId }'),
      'promotion update must be scoped by organizationId',
    )
  })

  it('unknown clerkId returns 200 and never creates a user', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    const branch = src.slice(src.indexOf("evt.type === 'user.deleted'"))
    assert.ok(branch.includes('console.warn'), 'must warn on unknown clerkId (not error)')
    assert.ok(branch.includes("return new Response('OK', { status: 200 })"), 'unknown clerkId must return 200')
    assert.equal(branch.includes('prisma.user.create'), false, 'must never create a user')
  })

  it('DB errors return 500 (Clerk retries) without exposing details', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    const branch = src.slice(src.indexOf("evt.type === 'user.deleted'"))
    assert.ok(branch.includes("return new Response('Failed to delete user', { status: 500 })"), 'must return 500 on DB failure')
    assert.ok(branch.includes('errorType=${err instanceof Error ? err.constructor.name : typeof err}'), 'error class goes to logs only')
    const firstResponse = branch.slice(branch.indexOf("return new Response('Failed to delete user'"))
    assert.ok(
      !firstResponse.includes('err.message') && !firstResponse.includes('prisma'),
      'response body must not echo the underlying DB error',
    )
  })

  it('Svix signature verification and body-size protection are intact', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    assert.ok(src.includes('new Webhook(WEBHOOK_SECRET)'), 'Svix Webhook must be instantiated')
    assert.ok(src.includes('wh.verify(body,'), 'Svix verify must be called')
    assert.ok(src.includes('"Request body too large"'), 'oversized body must return 413')
    assert.ok(src.includes('MAX_WEBHOOK_BYTES'), 'body size limit must be enforced')
  })

  it('final fall-through returns 200 OK', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    const lines = src.trim().split('\n').map((l) => l.trim()).filter(Boolean)
    const lastReturn = lines[lines.length - 2]
    assert.ok(
      lastReturn.includes("return new Response('OK', { status: 200 })"),
      'final fall-through must return 200 OK',
    )
  })
})

describe('B-15 schema contract: deleting a User is safe at the FK level', () => {
  it('user_organizations cascade (memberships only, never the org)', () => {
    const schema = readProjectFile('src/prisma/schema.prisma')
    const userOrg = schema.match(/UserOrganization \{[\s\S]*?\n}/)?.[0] ?? ''
    assert.ok(
      userOrg.includes('user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)'),
      'user→membership must cascade',
    )
    assert.ok(
      userOrg.includes('organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)'),
      'the org side already cascades (org delete → memberships), not user delete',
    )
  })

  it('commande.createdById is SetNull (business rows survive)', () => {
    const schema = readProjectFile('src/prisma/schema.prisma')
    assert.ok(
      /createdBy\s+User\?\s+@relation\(fields: \[createdById\], references: \[id\], onDelete: SetNull\)/.test(schema),
      'commande.createdById must be SetNull on user delete',
    )
  })

  it('no other relation references User.id', () => {
    const schema = readProjectFile('src/prisma/schema.prisma')
    // Direct FK declarations whose target model is `User`. The User model has
    // exactly two back-relations: UserOrganization.user (userId) and
    // Commande.createdBy (createdById). No other model (clients, events, menus,
    // invoices, payments, invitations, team members, submissions) has a User FK,
    // so deleting a User only cascades memberships and SetNulls createdById.
    const userFkRelations = schema.match(/[\w]+?\s+User\??\s*@relation\(/g) ?? []
    const names = userFkRelations.map((s) => s.trim().replace(/\s+.*/, ''))
    assert.equal(userFkRelations.length, 2, `expected exactly 2 User FKs, got: ${names.join(', ') || '(none)'}`)
    assert.ok(names.includes('user'), 'UserOrganization.user must be one of the User FKs')
    assert.ok(names.includes('createdBy'), 'Commande.createdBy must be one of the User FKs')
  })
})

// Remaining product/schema decision:
// When a deleted Clerk user is the SOLE OWNER of an organization, the local
// User row is intentionally KEPT (acknowledged 200). The schema has no
// isActive/deletedAt column to deactivate the account non-destructively, and
// re-provisioning on re-registration is not implemented, so a genuinely
// orphaned org cannot currently be reclaimed automatically. Supporting this
// cleanly requires a schema decision: add an `isActive`/`deletedAt` column on
// User (and a re-provision path) or define an explicit org-orphaning policy.