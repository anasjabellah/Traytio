/**
 * B-14 Clerk Webhook — user.updated profile synchronization — Unit Tests
 *
 * Finding B-14: the Clerk webhook (src/app/api/webhooks/clerk/route.ts)
 * only handled user.created and silently acknowledged all other events.
 * user.updated was ignored, leaving local profile fields (email, firstName,
 * lastName) permanently stale after a Clerk-side profile change.
 *
 * Fix: an else-if branch on evt.type === 'user.updated' now syncs the three
 * locally stored identity fields (email, firstName, lastName) via an
 * updateMany keyed on clerkId. The update is idempotent. Unknown clerkId
 * returns 200 (acknowledged, not applied) with a console.warn. No user
 * is created, no organization/role/financial logic is touched, and
 * imageUrl synchronization is deliberately excluded from this change.
 *
 * user.deleted is implemented separately in B-15 (tests/b15-clerk-webhook-
 * user-deleted.test.ts); this suite pins the user.created / user.updated
 * invariants only, and the "no user.deleted handler" guard has been replaced
 * by a presence contract since B-15 now owns that branch.
 *
 * Test convention: faithful replicas of the new handler logic (truth-table
 * tests) + fs contract checks on the actual source tree (no transitive deps),
 * same style as tests/b11-*, tests/b12-*, tests/b13-*.
 *
 * Run: npx tsx tests/b14-clerk-webhook-user-updated.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function readProjectFile(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

// ── Handler replica: faithful to the user.updated implementation ──

type SyncResult = { email: string; firstName: string | null; lastName: string | null } | null

/**
 * Mirrors the user.updated handler's updateMany behavior.
 * Returns the fields that would be written, or null if clerkId was not found.
 */
function simulateUserUpdated(
  store: Map<string, SyncResult>,
  clerkId: string,
  email: string,
  firstName: string | null,
  lastName: string | null,
): { count: number; applied: boolean } {
  const existing = store.get(clerkId)
  if (!existing) return { count: 0, applied: false }
  store.set(clerkId, { email, firstName, lastName })
  return { count: 1, applied: true }
}

// ── Tests ──

describe('B-14 user.updated syncs profile fields', () => {
  it('updates email, firstName, and lastName from Clerk event data', () => {
    const store = new Map<string, SyncResult>([
      ['user_1', { email: 'old@example.com', firstName: 'Old', lastName: 'Name' }],
    ])

    const result = simulateUserUpdated(store, 'user_1', 'new@example.com', 'New', 'Name')
    assert.equal(result.count, 1)
    assert.equal(result.applied, true)

    const updated = store.get('user_1')!
    assert.equal(updated.email, 'new@example.com')
    assert.equal(updated.firstName, 'New')
    assert.equal(updated.lastName, 'Name')
  })

  it('sets firstName/lastName to null when Clerk sends null', () => {
    const store = new Map<string, SyncResult>([
      ['user_1', { email: 'user@example.com', firstName: 'Jane', lastName: 'Doe' }],
    ])

    simulateUserUpdated(store, 'user_1', 'user@example.com', null, null)

    const updated = store.get('user_1')!
    assert.equal(updated.firstName, null)
    assert.equal(updated.lastName, null)
  })

  it('is idempotent: repeated calls with the same data produce the same result', () => {
    const store = new Map<string, SyncResult>([
      ['user_1', { email: 'a@b.com', firstName: 'A', lastName: 'B' }],
    ])

    const r1 = simulateUserUpdated(store, 'user_1', 'x@y.com', 'X', 'Y')
    const r2 = simulateUserUpdated(store, 'user_1', 'x@y.com', 'X', 'Y')

    assert.equal(r1.count, 1)
    assert.equal(r2.count, 1)
    assert.deepEqual(store.get('user_1'), { email: 'x@y.com', firstName: 'X', lastName: 'Y' })
  })

  it('does not affect other users when updating a specific clerkId', () => {
    const store = new Map<string, SyncResult>([
      ['user_1', { email: 'a@b.com', firstName: 'A', lastName: 'B' }],
      ['user_2', { email: 'c@d.com', firstName: 'C', lastName: 'D' }],
    ])

    simulateUserUpdated(store, 'user_1', 'z@z.com', 'Z', 'Z')

    const untouched = store.get('user_2')!
    assert.equal(untouched.email, 'c@d.com')
    assert.equal(untouched.firstName, 'C')
  })
})

describe('B-14 user.updated unknown clerkId behavior', () => {
  it('returns count 0 for an unknown clerkId (no user created)', () => {
    const store = new Map<string, SyncResult>([
      ['user_1', { email: 'a@b.com', firstName: 'A', lastName: 'B' }],
    ])

    const result = simulateUserUpdated(store, 'user_unknown', 'x@y.com', 'X', 'Y')
    assert.equal(result.count, 0)
    assert.equal(result.applied, false)
    assert.equal(store.size, 1, 'no new user should be created')
    assert.equal(store.has('user_unknown'), false, 'unknown user must not be added to store')
  })

  it('store is unchanged after an unknown clerkId attempt', () => {
    const store = new Map<string, SyncResult>([
      ['user_1', { email: 'a@b.com', firstName: 'A', lastName: 'B' }],
    ])

    simulateUserUpdated(store, 'user_unknown', 'x@y.com', 'X', 'Y')
    assert.deepEqual(store.get('user_1'), { email: 'a@b.com', firstName: 'A', lastName: 'B' })
  })
})

describe('B-14 source contract: route.ts implements the audit', () => {
  it('handles user.created (existing behavior preserved)', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    assert.ok(
      src.includes("evt.type === 'user.created'"),
      'user.created handler must be present',
    )
  })

  it('handles user.updated (new hardening)', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    assert.ok(
      src.includes("evt.type === 'user.updated'"),
      'user.updated handler must be present',
    )
  })

  it('user.updated syncs email, firstName, lastName via updateMany', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    assert.ok(
      src.includes('prisma.user.updateMany'),
      'user.updated must use updateMany (not update, not upsert)',
    )
    assert.ok(
      src.includes('where: { clerkId: id }'),
      'user.updated must key on clerkId',
    )
    assert.ok(
      src.includes('email,') && src.includes('firstName: first_name') && src.includes('lastName: last_name'),
      'user.updated must sync all three profile fields',
    )
  })

  it('user.updated is idempotent (updateMany on unique clerkId)', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    // updateMany with a unique-key where clause is inherently idempotent.
    assert.ok(
      src.includes('prisma.user.updateMany({'),
      'updateMany must be used for idempotent writes',
    )
  })

  it('unknown clerkId returns 200 (acknowledged, not retried)', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    // After the updateMany block, the handler must not throw or return 500
    // for count === 0; it should log and fall through to the final 200.
    assert.ok(
      src.includes('result.count === 0'),
      'must check for zero-match result',
    )
    assert.ok(
      src.includes('console.warn'),
      'must warn on unknown clerkId (not error)',
    )
  })

  it('user.updated error path returns 500 (consistent with user.created)', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    assert.ok(
      src.includes("'Failed to update user', { status: 500 }"),
      'user.updated DB errors must return 500',
    )
  })

  it('user.deleted is handled (implemented separately in B-15)', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    assert.ok(
      src.includes("evt.type === 'user.deleted'"),
      'user.deleted handler must be present (owned by B-15)',
    )
  })

  it('no organization/role/financial logic was changed in the new branch', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    // Extract JUST the user.updated branch (stops at the user.deleted branch,
    // which B-15 owns and legitimately touches roles/organizations).
    const updatedStart = src.indexOf("evt.type === 'user.updated'")
    const updatedEnd = src.indexOf("else if (evt.type === 'user.deleted')")
    const updatedBranch = src.slice(updatedStart, updatedEnd)

    assert.equal(
      updatedBranch.includes('organization'),
      false,
      'user.updated must not touch organization data',
    )
    assert.equal(
      updatedBranch.includes('OrgRole'),
      false,
      'user.updated must not modify roles',
    )
    assert.equal(
      updatedBranch.includes('transaction'),
      false,
      'user.updated does not need a transaction (single updateMany)',
    )
  })

  it('imageUrl is NOT synchronized in user.updated', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    const updatedStart = src.indexOf("evt.type === 'user.updated'")
    const handlerEnd = src.lastIndexOf('return new Response')
    const updatedBranch = src.slice(updatedStart, handlerEnd)

    assert.equal(
      updatedBranch.includes('imageUrl'),
      false,
      'imageUrl must not be synced in this change',
    )
  })

  it('Svix signature verification is intact', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    assert.ok(src.includes('new Webhook(WEBHOOK_SECRET)'), 'Svix Webhook must be instantiated')
    assert.ok(src.includes('wh.verify(body,'), 'Svix verify must be called')
    assert.ok(
      src.includes("'Invalid webhook signature'"),
      'invalid signature must return 400',
    )
  })

  it('oversized body protection is intact', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    assert.ok(
      src.includes('MAX_WEBHOOK_BYTES'),
      'body size limit must be enforced',
    )
    assert.ok(
      src.includes('"Request body too large"'),
      'oversized body must return 413',
    )
  })

  it('final fall-through returns 200 OK for all handled and unhandled events', () => {
    const src = readProjectFile('src/app/api/webhooks/clerk/route.ts')
    const lastLine = src.trim().split('\n').pop()!.trim()
    assert.equal(
      lastLine,
      '}',
      'handler must end with closing brace after the final return',
    )
    // The second-to-last non-empty line should be the final return 200.
    const lines = src.trim().split('\n').map(l => l.trim()).filter(Boolean)
    const lastReturn = lines[lines.length - 2]
    assert.ok(
      lastReturn.includes("return new Response('OK', { status: 200 })"),
      'final fall-through must return 200 OK',
    )
  })
})
