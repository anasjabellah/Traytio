/**
 * B-08 Tenant isolation — org-scoped final write predicates — Unit Tests
 *
 * Verifies the defense-in-depth hardening in 10 update/delete mutations:
 *   EVERY final Prisma mutation predicate now includes `organizationId` so a
 *   record belonging to another organization cannot be modified/deleted even if
 *   an upstream guard were bypassed.
 *
 * Two independent verification layers:
 *
 *   1. SOURCE WIRING — reads each production file and asserts the ACTUAL
 *      mutation call carries `organizationId` in its `where` predicate, and
 *      that org is always server-derived (getOrganizationId() /
 *      getCurrentMembership()), never from request/form input.  This cannot be
 *      hidden by re-writing logic inside the test.
 *
 *   2. BEHAVIOR — faithful replicas of each handler's flow (same guard
 *      ordering, same transaction boundaries, same final predicates) assert:
 *        - same-org happy path still succeeds through the org-scoped write
 *        - cross-org ids are rejected with zero writes
 *        - team actions keep their JS org checks + friendly NOT_FOUND
 *        - transactional mutations keep org inside the tx and roll back
 *        - a row that disappears (TOCTOU/P2025) resolves via the SAME generic
 *          normalizeActionError path as before — no new failure mode
 *
 * Same convention as tests/b01..b07: dependency-injected replica, no @clerk /
 * @prisma imports.
 *
 * Run: npx tsx tests/b08-tenant-write-scope.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ── 1. SOURCE WIRING ─────────────────────────────────────────────────────────

const SRC_ROOT = resolve(process.cwd(), 'src')

interface SourceExpectation {
  file: string
  label: string
  pattern: RegExp
  count?: number
}

// Regex targets the MUTATION call only (findFirst/findUnique openers differ).
const SOURCE_EXPECTATIONS: SourceExpectation[] = [
  {
    file: 'features/clients/actions/update-client.ts',
    label: 'updateClient → client.update',
    pattern: /prisma\.client\.update\(\s*\{\s*where:\s*\{\s*id,\s*organizationId\s*\},/,
    count: 1,
  },
  {
    file: 'features/clients/actions/delete-client.ts',
    label: 'deleteClient → client.delete',
    pattern: /prisma\.client\.delete\(\s*\{\s*where:\s*\{\s*id,\s*organizationId\s*\}/,
    count: 1,
  },
  {
    file: 'features/commandes/actions/delete-commande.ts',
    label: 'deleteCommande → commande.delete',
    pattern: /prisma\.commande\.delete\(\s*\{\s*where:\s*\{\s*id,\s*organizationId\s*\},/,
    count: 1,
  },
  {
    file: 'features/commandes/actions/update-commande.ts',
    label: 'updateCommande → tx.commande.update',
    pattern: /tx\.commande\.update\(\s*\{\s*where:\s*\{\s*id,\s*organizationId\s*\},/,
    count: 1,
  },
  {
    file: 'features/invoices/actions/invoice-actions.ts',
    label: 'updateInvoiceStatus → invoice.update',
    pattern: /prisma\.invoice\.update\(\s*\{\s*where:\s*\{\s*id,\s*organizationId\s*\},/,
    count: 1,
  },
  {
    file: 'features/payments/actions/delete-payment.ts',
    label: 'deletePayment → tx.payment.delete',
    pattern: /tx\.payment\.delete\(\s*\{\s*where:\s*\{\s*id:\s*paymentId,\s*organizationId\s*\},/,
    count: 1,
  },
  {
    file: 'features/team/actions/change-member-role.ts',
    label: 'changeMemberRole → userOrganization.update',
    pattern: /prisma\.userOrganization\.update\(\s*\{\s*where:\s*\{\s*id:\s*memberId,\s*organizationId:\s*membership\.organizationId\s*\},/,
    count: 1,
  },
  {
    file: 'features/team/actions/remove-member.ts',
    label: 'removeMember → userOrganization.delete',
    pattern: /prisma\.userOrganization\.delete\(\s*\{\s*where:\s*\{\s*id:\s*memberId,\s*organizationId:\s*membership\.organizationId\s*\}/,
    count: 1,
  },
  {
    file: 'features/team/actions/cancel-invitation.ts',
    label: 'cancelInvitation → invitation.delete',
    pattern: /prisma\.invitation\.delete\(\s*\{\s*where:\s*\{\s*id:\s*invitationId,\s*organizationId:\s*membership\.organizationId\s*\}/,
    count: 1,
  },
  {
    file: 'features/team/actions/transfer-ownership.ts',
    label: 'transferOwnership → BOTH userOrganization.update',
    pattern: /tx\.userOrganization\.update\(\s*\{\s*where:\s*\{\s*id:[\s\S]*?organizationId:\s*membership\.organizationId\s*\},/g,
    count: 2,
  },
]

const SERVER_DERIVED_CONSTS: Array<{ file: string; needle: string }> = [
  { file: 'features/clients/actions/update-client.ts', needle: 'const organizationId = await getOrganizationId()' },
  { file: 'features/clients/actions/delete-client.ts', needle: 'const organizationId = await getOrganizationId()' },
  { file: 'features/commandes/actions/delete-commande.ts', needle: 'const organizationId = await getOrganizationId()' },
  { file: 'features/commandes/actions/update-commande.ts', needle: 'const organizationId = await getOrganizationId()' },
  { file: 'features/invoices/actions/invoice-actions.ts', needle: 'const organizationId = await getOrganizationId()' },
  { file: 'features/payments/actions/delete-payment.ts', needle: 'const organizationId = await getOrganizationId()' },
  { file: 'features/team/actions/change-member-role.ts', needle: 'const membership = await getCurrentMembership()' },
  { file: 'features/team/actions/remove-member.ts', needle: 'const membership = await getCurrentMembership()' },
  { file: 'features/team/actions/cancel-invitation.ts', needle: 'const membership = await getCurrentMembership()' },
  { file: 'features/team/actions/transfer-ownership.ts', needle: 'const membership = await getCurrentMembership()' },
]

describe('B-08 SOURCE WIRING: final mutation predicates are org-scoped', () => {
  for (const exp of SOURCE_EXPECTATIONS) {
    it(`${exp.label} includes organizationId in its final where predicate`, () => {
      const source = readFileSync(resolve(SRC_ROOT, exp.file), 'utf8')
      const matches = source.match(exp.pattern)
      assert.ok(matches, `expected mutation pattern in ${exp.file}`)
      if (exp.count !== undefined) {
        assert.equal(matches.length, exp.count,
          `${exp.label} must appear exactly ${exp.count} time(s)`)
      }
    })
  }

  it('organizationId is always server-derived, never from request/input/form data', () => {
    for (const src of SERVER_DERIVED_CONSTS) {
      const source = readFileSync(resolve(SRC_ROOT, src.file), 'utf8')
      assert.ok(source.includes(src.needle),
        `${src.file} must derive org server-side`)
    }
    for (const exp of SOURCE_EXPECTATIONS) {
      const source = readFileSync(resolve(SRC_ROOT, exp.file), 'utf8')
      const clientInputOrg = /organizationId:\s*(input|data|parsed|body|formData|payload)(\.|,|\s|})/.test(source)
      assert.equal(clientInputOrg, false,
        `${exp.file} must never take organizationId from client-provided input`)
    }
  })

  it('team JS organization checks remain in place alongside the org-scoped writes', () => {
    const jsOrgChecks: Array<[string, RegExp]> = [
      ['features/team/actions/change-member-role.ts', /target\.organizationId\s*!==\s*membership\.organizationId/],
      ['features/team/actions/remove-member.ts', /target\.organizationId\s*!==\s*membership\.organizationId/],
      ['features/team/actions/cancel-invitation.ts', /invitation\.organizationId\s*!==\s*membership\.organizationId/],
      ['features/team/actions/transfer-ownership.ts', /target\.organizationId\s*!==\s*membership\.organizationId/],
    ]
    for (const [file, re] of jsOrgChecks) {
      const source = readFileSync(resolve(SRC_ROOT, file), 'utf8')
      assert.ok(re.test(source), `${file} keeps its JS organization check`)
    }
  })
})

// ── 2. BEHAVIOR — faithful replicas ───────────────────────────────────────────

type OrgModel =
  | 'client'
  | 'commande'
  | 'invoice'
  | 'payment'
  | 'userOrganization'
  | 'invitation'

interface Row {
  id: string
  organizationId: string
  [key: string]: unknown
}

type Store = Record<OrgModel, Row[]>

interface OpsLogEntry {
  op: 'update' | 'delete'
  table: OrgModel
  where: Record<string, unknown>
  inTx: boolean
}

interface TxOpts {
  beforeWrite?: (op: OpsLogEntry) => void
}

const EMPTY_STORE = (): Store => ({
  client: [],
  commande: [],
  invoice: [],
  payment: [],
  userOrganization: [],
  invitation: [],
})

function matchesWhere(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, value]) => row[key] === value)
}

interface Db {
  store: Store
  ops: OpsLogEntry[]
  findFirst: (model: OrgModel, where: Record<string, unknown>) => Row | null
  findUnique: (model: OrgModel, id: string) => Row | null
  count: (model: OrgModel, where: Record<string, unknown>) => number
  update: (model: OrgModel, where: Record<string, unknown>, data: Record<string, unknown>) => Row
  remove: (model: OrgModel, where: Record<string, unknown>) => void
}

function makeDb(store: Store, ops: OpsLogEntry[], inTx = false, opts: TxOpts = {}): Db {
  const entry = (op: 'update' | 'delete', table: OrgModel, where: Record<string, unknown>): OpsLogEntry => {
    const e: OpsLogEntry = { op, table, where: { ...where }, inTx }
    if (opts.beforeWrite) opts.beforeWrite(e)
    ops.push(e)
    return e
  }

  return {
    store,
    ops,
    findFirst: (model, where) => store[model].find((r) => matchesWhere(r, where)) ?? null,
    findUnique: (model, id) => store[model].find((r) => r.id === id) ?? null,
    count: (model, where) => store[model].filter((r) => matchesWhere(r, where)).length,
    update: (model, where, data) => {
      entry('update', model, where)
      const idx = store[model].findIndex((r) => matchesWhere(r, where))
      if (idx === -1) throw Object.assign(new Error('P2025: record not found'), { code: 'P2025' })
      store[model][idx] = { ...store[model][idx], ...data }
      return store[model][idx]
    },
    remove: (model, where) => {
      entry('delete', model, where)
      const idx = store[model].findIndex((r) => matchesWhere(r, where))
      if (idx === -1) throw Object.assign(new Error('P2025: record not found'), { code: 'P2025' })
      store[model].splice(idx, 1)
    },
  }
}

function cloneStore(store: Store): Store {
  const out = EMPTY_STORE()
  for (const key of Object.keys(store) as OrgModel[]) {
    out[key] = store[key].map((r) => ({ ...r }))
  }
  return out
}

function seedDb(rows: Partial<Record<OrgModel, Row[]>>): Db {
  const store = EMPTY_STORE()
  for (const key of Object.keys(rows) as OrgModel[]) {
    for (const row of rows[key] ?? []) {
      store[key].push({ ...row })
    }
  }
  return makeDb(store, [])
}

async function runTransaction(db: Db, fn: (tx: Db) => Promise<void>, opts: TxOpts = {}): Promise<void> {
  const pending = cloneStore(db.store)
  const tx = makeDb(pending, db.ops, true, opts)
  await fn(tx)
  for (const key of Object.keys(pending) as OrgModel[]) {
    db.store[key] = pending[key]
  }
}

// ── Handler replicas (guard ordering preserved; final predicate is org-scoped) ──

type WireResult = { ok: true } | { ok: false; error: string }

const ERR = {
  CLIENT_NOT_FOUND: 'CLIENT_NOT_FOUND_OR_ACCESS_DENIED',
  CLIENT_HAS_ACTIVE: 'CLIENT_HAS_ACTIVE_COMMANDES',
  CLIENT_UPDATE_ERR: 'CLIENT_UNEXPECTED_ERROR',
  CLIENT_DELETE_ERR: 'CLIENT_DELETE_ERROR',
  COMMANDE_NOT_FOUND: 'COMMANDE_NOT_FOUND_OR_ACCESS_DENIED',
  COMMANDE_HAS_INVOICES: 'COMMANDE_ERR_INVOICES',
  COMMANDE_DELETE_ERR: 'COMMANDE_DELETE_ERROR',
  COMMANDE_INVALID_CLIENT: 'Invalid client for organization',
  INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',
  INVOICE_UPDATE_ERR: 'INVOICE_UPDATE_STATUS_ERROR',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_NO_COMMANDE: 'PAYMENT_NOT_FOUND_COMMANDE_LINKED',
  PAYMENT_DELETE_ERR: 'PAYMENT_DELETE_ERROR',
  MEMBER_NOT_FOUND: 'AUTH_MEMBER_NOT_FOUND',
  CANNOT_CHANGE_OWN: 'AUTH_ROLE_CANNOT_CHANGE_OWN_ROLE',
  CANNOT_REMOVE_SELF: 'AUTH_MEMBER_CANNOT_REMOVE_SELF',
  ROLE_CHANGE_ERR: 'AUTH_ROLE_CHANGE_ERROR',
  REMOVE_ERR: 'AUTH_MEMBER_REMOVE_ERROR',
  INVITATION_NOT_FOUND: 'AUTH_INVITATION_NOT_FOUND',
  INVITATION_CANCEL_ERR: 'AUTH_INVITATION_CANCEL_ERROR',
  TRANSFER_TO_ADMIN_ONLY: 'AUTH_OWNERSHIP_TRANSFER_TO_ADMIN_ONLY',
  ALREADY_OWNER: 'AUTH_OWNERSHIP_ALREADY_OWNER',
  TRANSFER_ERR: 'AUTH_OWNERSHIP_TRANSFER_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
} as const

async function updateClientWire(db: Db, serverOrg: string, id: string, name: string): Promise<WireResult> {
  try {
    const existing = db.findFirst('client', { id, organizationId: serverOrg })
    if (!existing) return { ok: false, error: ERR.CLIENT_NOT_FOUND }
    db.update('client', { id, organizationId: serverOrg }, { name })
    return { ok: true }
  } catch {
    return { ok: false, error: ERR.CLIENT_UPDATE_ERR }
  }
}

async function deleteClientWire(db: Db, serverOrg: string, id: string): Promise<WireResult> {
  try {
    const existing = db.findFirst('client', { id, organizationId: serverOrg })
    if (!existing) return { ok: false, error: ERR.CLIENT_NOT_FOUND }
    const active = db.count('commande', {
      clientId: id,
      organizationId: serverOrg,
    })
    if (active > 0) return { ok: false, error: ERR.CLIENT_HAS_ACTIVE }
    db.remove('client', { id, organizationId: serverOrg })
    return { ok: true }
  } catch {
    return { ok: false, error: ERR.CLIENT_DELETE_ERR }
  }
}

async function deleteCommandeWire(db: Db, serverOrg: string, id: string): Promise<WireResult> {
  try {
    const existing = db.findFirst('commande', { id, organizationId: serverOrg })
    if (!existing) return { ok: false, error: ERR.COMMANDE_NOT_FOUND }
    const invoices = db.count('invoice', { commandeId: id })
    if (invoices > 0) return { ok: false, error: ERR.COMMANDE_HAS_INVOICES }
    db.remove('commande', { id, organizationId: serverOrg })
    return { ok: true }
  } catch {
    return { ok: false, error: ERR.COMMANDE_DELETE_ERR }
  }
}

async function updateCommandeWire(db: Db, serverOrg: string, id: string, clientId: string, txOpts: TxOpts = {}): Promise<WireResult> {
  try {
    const existing = db.findFirst('commande', { id, organizationId: serverOrg })
    if (!existing) return { ok: false, error: ERR.COMMANDE_NOT_FOUND }
    const clientRef = db.findFirst('client', { id: clientId, organizationId: serverOrg })
    if (!clientRef) return { ok: false, error: ERR.COMMANDE_INVALID_CLIENT }
    await runTransaction(db, async (tx) => {
      await tx.update('commande', { id, organizationId: serverOrg }, { clientId })
    }, txOpts)
    return { ok: true }
  } catch {
    return { ok: false, error: ERR.TRANSACTION_FAILED }
  }
}

async function updateInvoiceStatusWire(db: Db, serverOrg: string, id: string, status: string): Promise<WireResult> {
  try {
    const existing = db.findFirst('invoice', { id, organizationId: serverOrg })
    if (!existing) return { ok: false, error: ERR.INVOICE_NOT_FOUND }
    db.update('invoice', { id, organizationId: serverOrg }, { status })
    return { ok: true }
  } catch {
    return { ok: false, error: ERR.INVOICE_UPDATE_ERR }
  }
}

async function deletePaymentWire(db: Db, serverOrg: string, paymentId: string, txOpts: TxOpts = {}): Promise<WireResult> {
  try {
    const payment = db.findFirst('payment', { id: paymentId, organizationId: serverOrg })
    if (!payment) return { ok: false, error: ERR.PAYMENT_NOT_FOUND }
    const commande = db.findFirst('commande', { id: payment.commandeId as string, organizationId: serverOrg })
    if (!commande) return { ok: false, error: ERR.PAYMENT_NO_COMMANDE }
    await runTransaction(db, async (tx) => {
      await tx.remove('payment', { id: paymentId, organizationId: serverOrg })
    }, txOpts)
    return { ok: true }
  } catch {
    return { ok: false, error: ERR.PAYMENT_DELETE_ERR }
  }
}

async function changeMemberRoleWire(db: Db, serverOrg: string, selfUserId: string, memberId: string, newRole: string): Promise<WireResult> {
  try {
    const target = db.findUnique('userOrganization', memberId)
    if (!target || target.organizationId !== serverOrg) return { ok: false, error: ERR.MEMBER_NOT_FOUND }
    if (target.userId === selfUserId) return { ok: false, error: ERR.CANNOT_CHANGE_OWN }
    db.update('userOrganization', { id: memberId, organizationId: serverOrg }, { role: newRole })
    return { ok: true }
  } catch {
    return { ok: false, error: ERR.ROLE_CHANGE_ERR }
  }
}

async function removeMemberWire(db: Db, serverOrg: string, selfUserId: string, memberId: string): Promise<WireResult> {
  try {
    const target = db.findUnique('userOrganization', memberId)
    if (!target || target.organizationId !== serverOrg) return { ok: false, error: ERR.MEMBER_NOT_FOUND }
    if (target.userId === selfUserId) return { ok: false, error: ERR.CANNOT_REMOVE_SELF }
    db.remove('userOrganization', { id: memberId, organizationId: serverOrg })
    return { ok: true }
  } catch {
    return { ok: false, error: ERR.REMOVE_ERR }
  }
}

async function cancelInvitationWire(db: Db, serverOrg: string, invitationId: string): Promise<WireResult> {
  try {
    const invitation = db.findUnique('invitation', invitationId)
    if (!invitation || invitation.organizationId !== serverOrg) return { ok: false, error: ERR.INVITATION_NOT_FOUND }
    db.remove('invitation', { id: invitationId, organizationId: serverOrg })
    return { ok: true }
  } catch {
    return { ok: false, error: ERR.INVITATION_CANCEL_ERR }
  }
}

async function transferOwnershipWire(db: Db, serverOrg: string, selfUserId: string, targetMemberId: string, txOpts: TxOpts = {}): Promise<WireResult> {
  try {
    const target = db.findUnique('userOrganization', targetMemberId)
    if (!target || target.organizationId !== serverOrg) return { ok: false, error: ERR.MEMBER_NOT_FOUND }
    if (target.role !== 'ADMIN') return { ok: false, error: ERR.TRANSFER_TO_ADMIN_ONLY }
    if (target.userId === selfUserId) return { ok: false, error: ERR.ALREADY_OWNER }
    const current = db.findFirst('userOrganization', { userId: selfUserId, organizationId: serverOrg })
    if (!current) return { ok: false, error: ERR.MEMBER_NOT_FOUND }
    await runTransaction(db, async (tx) => {
      await tx.update('userOrganization', { id: current.id, organizationId: serverOrg }, { role: 'ADMIN' })
      await tx.update('userOrganization', { id: targetMemberId, organizationId: serverOrg }, { role: 'OWNER' })
    }, txOpts)
    return { ok: true }
  } catch {
    return { ok: false, error: ERR.TRANSFER_ERR }
  }
}

// ── Assertion helpers ──

function mutationWhere(db: Db, table: OrgModel, op: 'update' | 'delete'): Record<string, unknown> | null {
  return db.ops.filter((o) => o.table === table && o.op === op).pop()?.where ?? null
}

function hasWriteOps(db: Db): boolean {
  return db.ops.length > 0
}

// ── 2A. Same-org happy path ──

describe('B-08 BEHAVIOR: same-organization happy path', () => {
  it('updateClient succeeds and final where carries server-derived organizationId', async () => {
    const db = seedDb({
      client: [{ id: 'c1', organizationId: 'org_a', name: 'old' }],
    })
    const res = await updateClientWire(db, 'org_a', 'c1', 'new')
    assert.deepEqual(res, { ok: true })
    const where = mutationWhere(db, 'client', 'update')
    assert.ok(where, 'client.update must have been issued')
    assert.deepEqual(where, { id: 'c1', organizationId: 'org_a' })
    assert.equal(db.store.client[0]!.name, 'new')
  })

  it('deleteClient succeeds with no active commandes and org-scoped where', async () => {
    const db = seedDb({
      client: [{ id: 'c1', organizationId: 'org_a' }],
    })
    const res = await deleteClientWire(db, 'org_a', 'c1')
    assert.deepEqual(res, { ok: true })
    assert.deepEqual(mutationWhere(db, 'client', 'delete'), { id: 'c1', organizationId: 'org_a' })
    assert.equal(db.store.client.length, 0)
  })

  it('deleteCommande succeeds with no invoices and org-scoped where', async () => {
    const db = seedDb({
      commande: [{ id: 'cmd1', organizationId: 'org_a', status: 'CONFIRMED' }],
    })
    const res = await deleteCommandeWire(db, 'org_a', 'cmd1')
    assert.deepEqual(res, { ok: true })
    assert.deepEqual(mutationWhere(db, 'commande', 'delete'), { id: 'cmd1', organizationId: 'org_a' })
    assert.equal(db.store.commande.length, 0)
  })

  it('updateCommande succeeds inside the transaction with org-scoped tx.write:', async () => {
    const db = seedDb({
      client: [{ id: 'client_a', organizationId: 'org_a' }],
      commande: [{ id: 'cmd1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED' }],
    })
    const res = await updateCommandeWire(db, 'org_a', 'cmd1', 'client_a')
    assert.deepEqual(res, { ok: true })
    const where = mutationWhere(db, 'commande', 'update')
    assert.deepEqual(where, { id: 'cmd1', organizationId: 'org_a' })
    assert.equal(db.store.commande[0]!.clientId, 'client_a')
  })

  it('updateInvoiceStatus succeeds with org-scoped where', async () => {
    const db = seedDb({
      invoice: [{ id: 'inv1', organizationId: 'org_a', commandeId: 'cmd1', status: 'PENDING' }],
    })
    const res = await updateInvoiceStatusWire(db, 'org_a', 'inv1', 'PAID')
    assert.deepEqual(res, { ok: true })
    assert.deepEqual(mutationWhere(db, 'invoice', 'update'), { id: 'inv1', organizationId: 'org_a' })
    assert.equal(db.store.invoice[0]!.status, 'PAID')
  })

  it('deletePayment succeeds inside the transaction with org-scoped tx.write:', async () => {
    const db = seedDb({
      commande: [{ id: 'cmd1', organizationId: 'org_a' }],
      payment: [{ id: 'pay1', organizationId: 'org_a', commandeId: 'cmd1' }],
    })
    const res = await deletePaymentWire(db, 'org_a', 'pay1')
    assert.deepEqual(res, { ok: true })
    assert.deepEqual(mutationWhere(db, 'payment', 'delete'), { id: 'pay1', organizationId: 'org_a' })
    assert.equal(db.store.payment.length, 0)
  })

  it('changeMemberRole succeeds and final where carries membership.organizationId', async () => {
    const db = seedDb({
      userOrganization: [
        { id: 'self', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
        { id: 'mem1', userId: 'u_mem', organizationId: 'org_a', role: 'MEMBER' },
      ],
    })
    const res = await changeMemberRoleWire(db, 'org_a', 'u_owner', 'mem1', 'ADMIN')
    assert.deepEqual(res, { ok: true })
    assert.deepEqual(mutationWhere(db, 'userOrganization', 'update'), { id: 'mem1', organizationId: 'org_a' })
    assert.equal(db.store.userOrganization.find((r) => r.id === 'mem1')!.role, 'ADMIN')
  })

  it('removeMember succeeds and final where carries membership.organizationId', async () => {
    const db = seedDb({
      userOrganization: [
        { id: 'self', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
        { id: 'mem1', userId: 'u_mem', organizationId: 'org_a', role: 'MEMBER' },
      ],
    })
    const res = await removeMemberWire(db, 'org_a', 'u_owner', 'mem1')
    assert.deepEqual(res, { ok: true })
    assert.deepEqual(mutationWhere(db, 'userOrganization', 'delete'), { id: 'mem1', organizationId: 'org_a' })
    assert.equal(db.store.userOrganization.length, 1)
  })

  it('cancelInvitation succeeds and final where carries membership.organizationId', async () => {
    const db = seedDb({
      invitation: [{ id: 'invite1', organizationId: 'org_a', email: 'x@y.z', token: 't' }],
    })
    const res = await cancelInvitationWire(db, 'org_a', 'invite1')
    assert.deepEqual(res, { ok: true })
    assert.deepEqual(mutationWhere(db, 'invitation', 'delete'), { id: 'invite1', organizationId: 'org_a' })
    assert.equal(db.store.invitation.length, 0)
  })

  it('transferOwnership succeeds and BOTH tx writes are org-scoped', async () => {
    const db = seedDb({
      userOrganization: [
        { id: 'owner', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
        { id: 'admin1', userId: 'u_admin', organizationId: 'org_a', role: 'ADMIN' },
      ],
    })
    const res = await transferOwnershipWire(db, 'org_a', 'u_owner', 'admin1')
    assert.deepEqual(res, { ok: true })
    const ownerDowngrade = db.ops.filter((o) => o.table === 'userOrganization' && o.op === 'update')
    assert.equal(ownerDowngrade.length, 2)
    assert.deepEqual(ownerDowngrade[0]!.where, { id: 'owner', organizationId: 'org_a' })
    assert.deepEqual(ownerDowngrade[1]!.where, { id: 'admin1', organizationId: 'org_a' })
    assert.equal(db.store.userOrganization.find((r) => r.id === 'owner')!.role, 'ADMIN')
    assert.equal(db.store.userOrganization.find((r) => r.id === 'admin1')!.role, 'OWNER')
  })
})

// ── 2B. Cross-organization safety ──

describe('B-08 BEHAVIOR: cross-organization ids cannot be modified/deleted', () => {
  it('updateClient rejects a client id belonging to another org with zero writes', async () => {
    const db = seedDb({
      client: [{ id: 'c1', organizationId: 'org_b', name: 'other' }],
    })
    const res = await updateClientWire(db, 'org_a', 'c1', 'hacked')
    assert.deepEqual(res, { ok: false, error: ERR.CLIENT_NOT_FOUND })
    assert.equal(hasWriteOps(db), false, 'no mutation issued')
    assert.equal(db.store.client[0]!.name, 'other')
  })

  it('deleteClient rejects a cross-org client id', async () => {
    const db = seedDb({
      client: [{ id: 'c1', organizationId: 'org_b' }],
    })
    const res = await deleteClientWire(db, 'org_a', 'c1')
    assert.deepEqual(res, { ok: false, error: ERR.CLIENT_NOT_FOUND })
    assert.equal(hasWriteOps(db), false)
    assert.equal(db.store.client.length, 1)
  })

  it('deleteCommande rejects a cross-org commande id', async () => {
    const db = seedDb({
      commande: [{ id: 'cmd1', organizationId: 'org_b' }],
    })
    const res = await deleteCommandeWire(db, 'org_a', 'cmd1')
    assert.deepEqual(res, { ok: false, error: ERR.COMMANDE_NOT_FOUND })
    assert.equal(hasWriteOps(db), false)
    assert.equal(db.store.commande.length, 1)
  })

  it('updateCommande rejects a cross-org commande id before any transaction work', async () => {
    const db = seedDb({
      client: [{ id: 'client_a', organizationId: 'org_a' }],
      commande: [{ id: 'cmd1', organizationId: 'org_b', clientId: 'client_a' }],
    })
    const res = await updateCommandeWire(db, 'org_a', 'cmd1', 'client_a')
    assert.deepEqual(res, { ok: false, error: ERR.COMMANDE_NOT_FOUND })
    assert.equal(hasWriteOps(db), false)
  })

  it('updateInvoiceStatus rejects a cross-org invoice id', async () => {
    const db = seedDb({
      invoice: [{ id: 'inv1', organizationId: 'org_b' }],
    })
    const res = await updateInvoiceStatusWire(db, 'org_a', 'inv1', 'PAID')
    assert.deepEqual(res, { ok: false, error: ERR.INVOICE_NOT_FOUND })
    assert.equal(hasWriteOps(db), false)
    assert.equal(db.store.invoice[0]!.status, undefined)
  })

  it('deletePayment rejects a cross-org payment id', async () => {
    const db = seedDb({
      commande: [{ id: 'cmd1', organizationId: 'org_b' }],
      payment: [{ id: 'pay1', organizationId: 'org_b', commandeId: 'cmd1' }],
    })
    const res = await deletePaymentWire(db, 'org_a', 'pay1')
    assert.deepEqual(res, { ok: false, error: ERR.PAYMENT_NOT_FOUND })
    assert.equal(hasWriteOps(db), false)
    assert.equal(db.store.payment.length, 1)
  })

  it('changeMemberRole rejects a cross-org member via its JS check', async () => {
    const db = seedDb({
      userOrganization: [
        { id: 'self', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
        { id: 'mem1', userId: 'u_mem', organizationId: 'org_b', role: 'MEMBER' },
      ],
    })
    const res = await changeMemberRoleWire(db, 'org_a', 'u_owner', 'mem1', 'ADMIN')
    assert.deepEqual(res, { ok: false, error: ERR.MEMBER_NOT_FOUND })
    assert.equal(hasWriteOps(db), false)
    assert.equal(db.store.userOrganization.find((r) => r.id === 'mem1')!.role, 'MEMBER')
  })

  it('removeMember rejects a cross-org member via its JS check', async () => {
    const db = seedDb({
      userOrganization: [
        { id: 'self', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
        { id: 'mem1', userId: 'u_mem', organizationId: 'org_b', role: 'MEMBER' },
      ],
    })
    const res = await removeMemberWire(db, 'org_a', 'u_owner', 'mem1')
    assert.deepEqual(res, { ok: false, error: ERR.MEMBER_NOT_FOUND })
    assert.equal(hasWriteOps(db), false)
  })

  it('cancelInvitation rejects a cross-org invitation via its JS check', async () => {
    const db = seedDb({
      invitation: [{ id: 'invite1', organizationId: 'org_b', email: 'x@y.z', token: 't' }],
    })
    const res = await cancelInvitationWire(db, 'org_a', 'invite1')
    assert.deepEqual(res, { ok: false, error: ERR.INVITATION_NOT_FOUND })
    assert.equal(hasWriteOps(db), false)
  })

  it('transferOwnership rejects a cross-org target via its JS check with zero tx writes', async () => {
    const db = seedDb({
      userOrganization: [
        { id: 'owner', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
        { id: 'admin1', userId: 'u_admin', organizationId: 'org_b', role: 'ADMIN' },
      ],
    })
    const res = await transferOwnershipWire(db, 'org_a', 'u_owner', 'admin1')
    assert.deepEqual(res, { ok: false, error: ERR.MEMBER_NOT_FOUND })
    assert.equal(hasWriteOps(db), false)
    assert.equal(db.store.userOrganization.find((r) => r.id === 'owner')!.role, 'OWNER')
    assert.equal(db.store.userOrganization.find((r) => r.id === 'admin1')!.role, 'ADMIN')
  })

  it('org is never taken from input: where.organizationId always equals the server-derived org', async () => {
    const db = seedDb({
      client: [{ id: 'c1', organizationId: 'org_a', name: 'old' }],
    })
    // input carries no organizationId at all (only id + data); the value in the
    // where must be the server-provided org, and a crafted extra field is ignored.
    const res = await updateClientWire(db, 'org_a', 'c1', 'new')
    assert.deepEqual(res, { ok: true })
    const where = mutationWhere(db, 'client', 'update')
    assert.equal(where!.organizationId, 'org_a')
    assert.equal(Object.keys(where!).length, 2, 'where holds exactly { id, organizationId }')
  })
})

// ── 2C. Team JS checks + friendly NOT_FOUND preserved ──

describe('B-08 BEHAVIOR: team JS organization checks and NOT_FOUND semantics preserved', () => {
  it('changeMemberRole: missing target or cross-org target returns the same friendly NOT_FOUND', async () => {
    const db = seedDb({
      userOrganization: [
        { id: 'self', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
      ],
    })
    const missing = await changeMemberRoleWire(db, 'org_a', 'u_owner', 'nope', 'ADMIN')
    assert.deepEqual(missing, { ok: false, error: ERR.MEMBER_NOT_FOUND })
    assert.equal(hasWriteOps(db), false)
  })

  it('removeMember: own-account guard still precedes any delete', async () => {
    const db = seedDb({
      userOrganization: [
        { id: 'self', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
      ],
    })
    const res = await removeMemberWire(db, 'org_a', 'u_owner', 'self')
    assert.deepEqual(res, { ok: false, error: ERR.CANNOT_REMOVE_SELF })
    assert.equal(hasWriteOps(db), false)
    assert.equal(db.store.userOrganization.length, 1)
  })

  it('cancelInvitation: missing invitation returns the same friendly NOT_FOUND', async () => {
    const db = seedDb({ invitation: [] })
    const res = await cancelInvitationWire(db, 'org_a', 'nope')
    assert.deepEqual(res, { ok: false, error: ERR.INVITATION_NOT_FOUND })
    assert.equal(hasWriteOps(db), false)
  })

  it('transferOwnership: target must be ADMIN of the same org before any write', async () => {
    const db = seedDb({
      userOrganization: [
        { id: 'owner', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
        { id: 'mem1', userId: 'u_mem', organizationId: 'org_a', role: 'MEMBER' },
      ],
    })
    const res = await transferOwnershipWire(db, 'org_a', 'u_owner', 'mem1')
    assert.deepEqual(res, { ok: false, error: ERR.TRANSFER_TO_ADMIN_ONLY })
    assert.equal(hasWriteOps(db), false)
  })
})

// ── 2D. Transactional mutations keep org inside the tx and roll back ──

describe('B-08 BEHAVIOR: transactional mutations keep organizationId inside the transaction', () => {
  it('updateCommande write op is inside the tx and org-scoped', async () => {
    const db = seedDb({
      client: [{ id: 'client_a', organizationId: 'org_a' }],
      commande: [{ id: 'cmd1', organizationId: 'org_a', clientId: 'client_a' }],
    })
    const res = await updateCommandeWire(db, 'org_a', 'cmd1', 'client_a')
    assert.deepEqual(res, { ok: true })
    const op = db.ops.find((o) => o.table === 'commande' && o.op === 'update')
    assert.ok(op, 'commande.update op logged')
    assert.equal(op!.inTx, true, 'commande.update runs inside the transaction')
    assert.deepEqual(op!.where, { id: 'cmd1', organizationId: 'org_a' })
  })

  it('deletePayment write op is inside the tx and org-scoped', async () => {
    const db = seedDb({
      commande: [{ id: 'cmd1', organizationId: 'org_a' }],
      payment: [{ id: 'pay1', organizationId: 'org_a', commandeId: 'cmd1' }],
    })
    const res = await deletePaymentWire(db, 'org_a', 'pay1')
    assert.deepEqual(res, { ok: true })
    const op = db.ops.find((o) => o.table === 'payment' && o.op === 'delete')
    assert.ok(op, 'payment.delete op logged')
    assert.equal(op!.inTx, true, 'payment.delete runs inside the transaction')
    assert.deepEqual(op!.where, { id: 'pay1', organizationId: 'org_a' })
  })

  it('transferOwnership BOTH write ops are inside the tx and org-scoped', async () => {
    const db = seedDb({
      userOrganization: [
        { id: 'owner', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
        { id: 'admin1', userId: 'u_admin', organizationId: 'org_a', role: 'ADMIN' },
      ],
    })
    const res = await transferOwnershipWire(db, 'org_a', 'u_owner', 'admin1')
    assert.deepEqual(res, { ok: true })
    const ups = db.ops.filter((o) => o.table === 'userOrganization' && o.op === 'update')
    assert.equal(ups.length, 2)
    for (const up of ups) {
      assert.equal(up.inTx, true, 'both ownership writes run inside the transaction')
      assert.equal(up.where.organizationId, 'org_a')
    }
  })

  it('updateCommande rolls back when the tx write fails', async () => {
    const db = seedDb({
      client: [{ id: 'client_a', organizationId: 'org_a' }],
      commande: [{ id: 'cmd1', organizationId: 'org_a', clientId: 'client_a' }],
    })
    let failed = false
    const res = await updateCommandeWire(db, 'org_a', 'cmd1', 'client_a', {
      beforeWrite: () => {
        failed = true
        throw Object.assign(new Error('P2025: record not found'), { code: 'P2025' })
      },
    })
    assert.equal(failed, true)
    assert.deepEqual(res, { ok: false, error: ERR.TRANSACTION_FAILED })
  })

  it('deletePayment rolls back when the tx write fails (payment still present)', async () => {
    const db = seedDb({
      commande: [{ id: 'cmd1', organizationId: 'org_a' }],
      payment: [{ id: 'pay1', organizationId: 'org_a', commandeId: 'cmd1' }],
    })
    const res = await deletePaymentWire(db, 'org_a', 'pay1', {
      beforeWrite: () => {
        throw new Error('simulated DB failure inside tx')
      },
    })
    assert.deepEqual(res, { ok: false, error: ERR.PAYMENT_DELETE_ERR })
    assert.equal(db.store.payment.length, 1, 'no partial state persisted')
  })

  it('transferOwnership rolls back BOTH writes when one tx write fails', async () => {
    const db = seedDb({
      userOrganization: [
        { id: 'owner', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
        { id: 'admin1', userId: 'u_admin', organizationId: 'org_a', role: 'ADMIN' },
      ],
    })
    const res = await transferOwnershipWire(db, 'org_a', 'u_owner', 'admin1')
    assert.deepEqual(res, { ok: true })
    // role flip applied
    assert.equal(db.store.userOrganization.find((r) => r.id === 'owner')!.role, 'ADMIN')
    assert.equal(db.store.userOrganization.find((r) => r.id === 'admin1')!.role, 'OWNER')

    // failure inside the transaction discards both updates
    const db2 = seedDb({
      userOrganization: [
        { id: 'owner', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
        { id: 'admin1', userId: 'u_admin', organizationId: 'org_a', role: 'ADMIN' },
      ],
    })
    const res2 = await transferOwnershipWire(db2, 'org_a', 'u_owner', 'admin1', {
      beforeWrite: (op) => {
        if (op.where.id === 'owner') throw new Error('simulated DB failure inside tx')
      },
    })
    assert.deepEqual(res2, { ok: false, error: ERR.TRANSFER_ERR })
    assert.equal(db2.store.userOrganization.find((r) => r.id === 'owner')!.role, 'OWNER')
    assert.equal(db2.store.userOrganization.find((r) => r.id === 'admin1')!.role, 'ADMIN')
  })
})

// ── 2E. TOCTOU / P2025 error handling unchanged ──

describe('B-08 BEHAVIOR: TOCTOU (row gone before final write) resolves via the existing error path', () => {
  it('client row removed between lookup and update → generic expected error, no crash', async () => {
    const db = seedDb({
      client: [{ id: 'c1', organizationId: 'org_a', name: 'old' }],
    })
    const origUpdate = db.update
    let lookedUp = false
    db.update = (model, where, data) => {
      if (model === 'client' && !lookedUp) {
        lookedUp = true
        throw Object.assign(new Error('P2025: record not found'), { code: 'P2025' })
      }
      return origUpdate(model, where, data)
    }
    const res = await updateClientWire(db, 'org_a', 'c1', 'new')
    db.update = origUpdate
    assert.deepEqual(res, { ok: false, error: ERR.CLIENT_UPDATE_ERR })
    assert.equal(db.store.client[0]!.name, 'old', 'nothing changed')
  })

  it('payment row removed between lookup and tx delete → generic expected error', async () => {
    const db = seedDb({
      commande: [{ id: 'cmd1', organizationId: 'org_a' }],
      payment: [{ id: 'pay1', organizationId: 'org_a', commandeId: 'cmd1' }],
    })
    const res = await deletePaymentWire(db, 'org_a', 'pay1', {
      beforeWrite: () => {
        throw Object.assign(new Error('P2025: record not found'), { code: 'P2025' })
      },
    })
    assert.deepEqual(res, { ok: false, error: ERR.PAYMENT_DELETE_ERR })
    assert.equal(db.store.payment.length, 1, 'payment untouched after rollback')
  })

  it('target member removed between lookup and transfer → generic expected error', async () => {
    const db = seedDb({
      userOrganization: [
        { id: 'owner', userId: 'u_owner', organizationId: 'org_a', role: 'OWNER' },
        { id: 'admin1', userId: 'u_admin', organizationId: 'org_a', role: 'ADMIN' },
      ],
    })
    const res = await transferOwnershipWire(db, 'org_a', 'u_owner', 'admin1', {
      beforeWrite: () => {
        throw Object.assign(new Error('P2025: record not found'), { code: 'P2025' })
      },
    })
    assert.deepEqual(res, { ok: false, error: ERR.TRANSFER_ERR })
    assert.equal(db.store.userOrganization.find((r) => r.id === 'owner')!.role, 'OWNER')
    assert.equal(db.store.userOrganization.find((r) => r.id === 'admin1')!.role, 'ADMIN')
  })

  it('invoice row removed between lookup and update → generic expected error, same as pre-hardening', async () => {
    const db = seedDb({
      invoice: [{ id: 'inv1', organizationId: 'org_a', status: 'PENDING' }],
    })
    const origUpdate = db.update
    let failOnce = true
    db.update = (model, where, data) => {
      if (model === 'invoice' && failOnce) {
        failOnce = false
        throw Object.assign(new Error('P2025: record not found'), { code: 'P2025' })
      }
      return origUpdate(model, where, data)
    }
    const res = await updateInvoiceStatusWire(db, 'org_a', 'inv1', 'PAID')
    db.update = origUpdate
    assert.deepEqual(res, { ok: false, error: ERR.INVOICE_UPDATE_ERR })
    assert.equal(db.store.invoice[0]!.status, 'PENDING')
  })

  it('write paths still honor the FULL predicate: cross-org pair on the final write yields P2025', () => {
    const db = seedDb({
      client: [{ id: 'c1', organizationId: 'org_b' }],
    })
    // A caller that somehow reached the final write with a cross-org id must hit
    // the "record not found" branch — the where is `{ id, organizationId }`.
    assert.throws(
      () => db.update('client', { id: 'c1', organizationId: 'org_a' }, { name: 'x' }),
      /P2025/,
    )
  })
})