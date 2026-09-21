/**
 * Notification Center — regression tests.
 *
 * Covers: creation fan-out, listing (order + 20-limit), unread count,
 * mark one/all read, user isolation, organization isolation, href,
 * count updates, and business-action wiring — plus source contracts proving
 * the production code enforces org+user scoping server-side.
 *
 * Follows tests/b01..n08 conventions: dependency-injected replicas +
 * fs source-contract checks — no @clerk/@prisma imports, no DB.
 *
 * Run: npx tsx tests/notifications.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')
const read = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf8')

// ── In-memory replica (mirrors notification-actions.ts + notify.ts) ──

type Row = {
  id: string
  organizationId: string
  userId: string
  type: string
  title: string
  message: string
  href: string | null
  readAt: Date | null
  createdAt: Date
}

type Member = { organizationId: string; userId: string }

const LIST_LIMIT = 20

function makeStore(rows: Row[] = [], members: Member[] = []) {
  const store = { rows: [...rows], members: [...members], seq: rows.length }
  return store
}
type Store = ReturnType<typeof makeStore>

function notifyMembers(store: Store, organizationId: string, input: { type: string; title: string; message: string; href?: string | null }): number {
  const userIds = [...new Set(store.members.filter((m) => m.organizationId === organizationId).map((m) => m.userId))]
  for (const userId of userIds) {
    store.seq += 1
    store.rows.push({
      id: `n${store.seq}`, organizationId, userId,
      type: input.type, title: input.title, message: input.message,
      href: input.href ?? null, readAt: null, createdAt: new Date(Date.now() + store.seq),
    })
  }
  return userIds.length
}

function listNotifications(store: Store, organizationId: string, userId: string): Row[] {
  return store.rows
    .filter((r) => r.organizationId === organizationId && r.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, LIST_LIMIT)
}

function unreadCount(store: Store, organizationId: string, userId: string): number {
  return store.rows.filter((r) => r.organizationId === organizationId && r.userId === userId && r.readAt === null).length
}

function markRead(store: Store, organizationId: string, userId: string, id: string): boolean {
  const row = store.rows.find((r) => r.id === id && r.organizationId === organizationId && r.userId === userId && r.readAt === null)
  if (!row) return false
  row.readAt = new Date()
  return true
}

function markAllRead(store: Store, organizationId: string, userId: string): number {
  let n = 0
  for (const r of store.rows) {
    if (r.organizationId === organizationId && r.userId === userId && r.readAt === null) {
      r.readAt = new Date()
      n += 1
    }
  }
  return n
}

// ── 1–5, 8–11: core behavior ────────────────────────────────────────

describe('NOTIFICATIONS BEHAVIOR: core', () => {
  it('1. creation fans out to every org member', () => {
    const store = makeStore([], [
      { organizationId: 'org_a', userId: 'u1' },
      { organizationId: 'org_a', userId: 'u2' },
      { organizationId: 'org_b', userId: 'u9' },
    ])
    const n = notifyMembers(store, 'org_a', { type: 'PAYMENT_RECEIVED', title: 'Paiement reçu', message: 'm', href: '/dashboard/commandes/c1' })
    assert.equal(n, 2)
    assert.equal(store.rows.length, 2)
    assert.ok(store.rows.every((r) => r.organizationId === 'org_a'))
  })

  it('2/9. listing is newest-first', () => {
    const store = makeStore([
      { id: 'n1', organizationId: 'o', userId: 'u', type: 'T1', title: 't', message: 'm', href: null, readAt: null, createdAt: new Date('2026-01-01') },
      { id: 'n2', organizationId: 'o', userId: 'u', type: 'T2', title: 't', message: 'm', href: null, readAt: null, createdAt: new Date('2026-01-03') },
      { id: 'n3', organizationId: 'o', userId: 'u', type: 'T3', title: 't', message: 'm', href: null, readAt: null, createdAt: new Date('2026-01-02') },
    ])
    const out = listNotifications(store, 'o', 'u').map((r) => r.id)
    assert.deepEqual(out, ['n2', 'n3', 'n1'])
  })

  it('10. listing is capped at 20', () => {
    const store = makeStore()
    for (let i = 0; i < 25; i++) {
      store.seq += 1
      store.rows.push({ id: `n${i}`, organizationId: 'o', userId: 'u', type: 'T', title: 't', message: 'm', href: null, readAt: null, createdAt: new Date(Date.now() + i) })
    }
    assert.equal(listNotifications(store, 'o', 'u').length, 20)
  })

  it('3/11. unread count reflects reads', () => {
    const store = makeStore([
      { id: 'n1', organizationId: 'o', userId: 'u', type: 'T', title: 't', message: 'm', href: null, readAt: null, createdAt: new Date() },
      { id: 'n2', organizationId: 'o', userId: 'u', type: 'T', title: 't', message: 'm', href: null, readAt: null, createdAt: new Date() },
      { id: 'n3', organizationId: 'o', userId: 'u', type: 'T', title: 't', message: 'm', href: null, readAt: null, createdAt: new Date() },
    ])
    assert.equal(unreadCount(store, 'o', 'u'), 3)
    assert.equal(markRead(store, 'o', 'u', 'n1'), true)
    assert.equal(unreadCount(store, 'o', 'u'), 2)
  })

  it('4. mark one read returns false for unknown ids', () => {
    const store = makeStore()
    assert.equal(markRead(store, 'o', 'u', 'nope'), false)
  })

  it('5. mark all read marks only the caller\'s unread rows', () => {
    const store = makeStore([
      { id: 'n1', organizationId: 'o', userId: 'u', type: 'T', title: 't', message: 'm', href: null, readAt: null, createdAt: new Date() },
      { id: 'n2', organizationId: 'o', userId: 'u', type: 'T', title: 't', message: 'm', href: null, readAt: new Date(), createdAt: new Date() },
      { id: 'n3', organizationId: 'o', userId: 'other', type: 'T', title: 't', message: 'm', href: null, readAt: null, createdAt: new Date() },
    ])
    assert.equal(markAllRead(store, 'o', 'u'), 1)
    assert.equal(unreadCount(store, 'o', 'u'), 0)
    assert.equal(unreadCount(store, 'o', 'other'), 1)
  })

  it('8. href is preserved through create → list', () => {
    const store = makeStore([], [{ organizationId: 'o', userId: 'u' }])
    notifyMembers(store, 'o', { type: 'COMMANDE_CREATED', title: 't', message: 'm', href: '/dashboard/commandes/c1' })
    assert.equal(listNotifications(store, 'o', 'u')[0]!.href, '/dashboard/commandes/c1')
  })
})

// ── 6–7: isolation ─────────────────────────────────────────────────

describe('NOTIFICATIONS BEHAVIOR: isolation', () => {
  function twoUserStore(): Store {
    return makeStore(
      [
        { id: 'n1', organizationId: 'org_a', userId: 'alice', type: 'T', title: 't', message: 'm', href: null, readAt: null, createdAt: new Date() },
        { id: 'n2', organizationId: 'org_b', userId: 'alice', type: 'T', title: 't', message: 'm', href: null, readAt: null, createdAt: new Date() },
        { id: 'n3', organizationId: 'org_a', userId: 'bob', type: 'T', title: 't', message: 'm', href: null, readAt: null, createdAt: new Date() },
      ],
      [
        { organizationId: 'org_a', userId: 'alice' },
        { organizationId: 'org_a', userId: 'bob' },
        { organizationId: 'org_b', userId: 'alice' },
      ],
    )
  }

  it('6. user isolation: list shows only the caller\'s rows', () => {
    const store = twoUserStore()
    assert.deepEqual(listNotifications(store, 'org_a', 'alice').map((r) => r.id), ['n1'])
    assert.deepEqual(listNotifications(store, 'org_a', 'bob').map((r) => r.id), ['n3'])
  })

  it('6. user isolation: cannot mark another user\'s notification', () => {
    const store = twoUserStore()
    assert.equal(markRead(store, 'org_a', 'bob', 'n1'), false)
    assert.equal(unreadCount(store, 'org_a', 'alice'), 1)
  })

  it('7. organization isolation: rows never leak across orgs', () => {
    const store = twoUserStore()
    assert.deepEqual(listNotifications(store, 'org_b', 'alice').map((r) => r.id), ['n2'])
    assert.equal(markRead(store, 'org_b', 'alice', 'n1'), false)
    assert.equal(markAllRead(store, 'org_b', 'alice'), 1)
    assert.equal(unreadCount(store, 'org_a', 'alice'), 1)
  })

  it('7. fan-out never crosses organizations', () => {
    const store = twoUserStore()
    notifyMembers(store, 'org_a', { type: 'T', title: 't', message: 'm' })
    assert.equal(listNotifications(store, 'org_b', 'alice').length, 1)
  })
})

// ── 12 + source contracts ──────────────────────────────────────────

describe('NOTIFICATIONS SOURCE CONTRACT', () => {
  it('Prisma model is org+user scoped with the required indexes and safe cascades', () => {
    const src = read('prisma/schema.prisma')
    assert.ok(src.includes('model Notification {'), 'model exists')
    assert.ok(src.includes('enum NotificationType {'), 'type enum exists')
    for (const t of ['COMMANDE_CREATED', 'PAYMENT_RECEIVED', 'EVENT_CREATED', 'INVOICE_CREATED', 'TEAM_INVITATION']) {
      assert.ok(src.includes(t), `enum has ${t}`)
    }
    assert.ok(src.includes('@@index([organizationId, userId])'), 'org+user index')
    assert.ok(src.includes('@@index([userId, readAt])'), 'user+readAt index')
    assert.ok(src.includes('@@index([createdAt])'), 'createdAt index')
    assert.ok(src.includes('@@map("notifications")'), 'table mapping')
  })

  it('migration exists and touches only notifications', () => {
    const sql = read('prisma/migrations/20260921000000_add_notifications/migration.sql')
    assert.ok(sql.includes('CREATE TABLE "notifications"'), 'creates the table')
    assert.ok(sql.includes('CREATE TYPE "NotificationType"'), 'creates the enum')
    assert.ok(!sql.includes('ALTER TABLE "commandes"'), 'no commande changes')
    assert.ok(!sql.includes('ALTER TABLE "payments"'), 'no payment changes')
    assert.ok(!sql.includes('DROP'), 'nothing dropped')
  })

  it('permissions matrix covers notifications for every role', () => {
    const src = read('lib/permissions.ts')
    assert.ok(src.includes("'notifications'"), 'module registered')
    assert.ok(src.includes('read:'), 'read action present')
  })

  it('actions resolve identity server-side and scope every query', () => {
    const src = read('features/notifications/actions/notification-actions.ts')
    assert.ok(src.includes('getCurrentMembership()'), 'identity from session, never client input')
    assert.ok(!src.includes('process.env'), 'no env trust issues')
    const scoped = (src.match(/organizationId: membership\.organizationId/g) ?? []).length
    assert.ok(scoped >= 4, `org scoping present (${scoped} occurrences)`)
    const userScoped = (src.match(/userId: membership\.userId/g) ?? []).length
    assert.ok(userScoped >= 4, `user scoping present (${userScoped} occurrences)`)
    assert.ok(src.includes("assertCan('notifications', 'read')"), 'RBAC on reads')
    assert.ok(src.includes("assertCan('notifications', 'update')"), 'RBAC on mutations')
    assert.ok(src.includes('take: NOTIFICATION_LIST_LIMIT'), 'bounded listing (20)')
  })

  it('12. all five business actions fan out notifications best-effort', () => {
    const hooks: Array<[string, string]> = [
      ['features/commandes/actions/create-commande.ts', 'COMMANDE_CREATED'],
      ['features/payments/actions/record-payment.ts', 'PAYMENT_RECEIVED'],
      ['features/events/actions/create-event.ts', 'EVENT_CREATED'],
      ['features/invoices/actions/invoice-actions.ts', 'INVOICE_CREATED'],
      ['features/team/actions/invite-member.ts', 'TEAM_INVITATION'],
    ]
    for (const [f, type] of hooks) {
      const src = read(f)
      assert.ok(src.includes('notifyOrganizationMembers'), `${f} calls the fan-out service`)
      assert.ok(src.includes(`type: '${type}'`), `${f} uses ${type}`)
      assert.ok(src.includes('Intentionally swallowed'), `${f} never fails its action on fan-out errors`)
    }
  })

  it('TopBar bell reads the backend with unread badge and read-on-click', () => {
    const src = read('components/dashboard/top-bar.tsx')
    assert.ok(src.includes('useNotifications()'), 'uses the React Query hook')
    assert.ok(!src.includes('useNotificationStore'), 'legacy client-only store detached')
    assert.ok(src.includes('unreadCount > 0'), 'badge only when unread exist')
    assert.ok(src.includes('Tout marquer comme lu'), 'mark-all affordance present')
    assert.ok(src.includes('formatRelativeTime'), 'relative timestamps')
    assert.ok(src.includes('handleNotificationClick'), 'click marks read then navigates')
  })

  it('hook uses stable query keys with invalidation and no polling', () => {
    const src = read('features/notifications/hooks/use-notifications.ts')
    assert.ok(src.includes("['notifications']"), 'list key')
    assert.ok(src.includes("['notifications', 'unread-count']"), 'count key')
    assert.ok(src.includes('invalidateQueries'), 'mutations invalidate')
    assert.ok(!src.includes('refetchInterval'), 'no aggressive polling')
  })
})
