/**
 * N-05 update-commande items semantics — Unit Tests
 *
 * Finding N-5 (CONFIRMED BUG): update-commande previously used
 *
 *   items: data.items && data.items.length > 0 ? { deleteMany: {}, create: [...] } : undefined
 *
 * so an explicit `items: []` (user removed every line item in the edit form)
 * silently meant "do nothing" — existing line items could never be cleared.
 *
 * Fix:
 *   - `create-commande-schema.ts` no longer defaults a missing `items` key to `[]`
 *     (`z.array(..., ).optional()`, no `.default([])`), so an OMITTED key survives
 *     as `undefined` and is distinguishable from an EXPLICIT empty array.
 *   - `update-commande.ts` now implements three states:
 *       undefined (omitted)  → no item update
 *       []                   → explicitly clear all existing line items (deleteMany)
 *       non-empty            → replace items (deleteMany + create)
 *   - create-commande.ts keeps normalizing a possibly-`undefined` items with
 *     `?? []` (create behavior unchanged).
 *
 * This file follows the tests/b01..b14 convention: dependency-injected replicas
 * and fs source-contract checks — no @clerk/@prisma imports, no DB required.
 *
 * Run: npx tsx tests/n05-update-commande-items.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── Types ────────────────────────────────────────────────────────────────────

interface CommandeItemRow {
  id: string
  commandeId: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  menuItemId?: string | null
  notes?: string | null
}

interface ItemInput {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  menuItemId?: string | null
  notes?: string | null
}

interface ItemCreateSpec {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  menuItemId?: string
  notes?: string | null
}

type ItemsSpec =
  | undefined
  | { deleteMany: Record<string, never>; create: ItemCreateSpec[] }

type Row = Record<string, unknown>

interface Store {
  commandes: Row[]
  clients: Row[]
  menuItems: Row[]
  items: CommandeItemRow[]
}

type Op =
  | { kind: 'commandeUpdate'; where: Record<string, unknown>; inTx: boolean; itemsSpec: ItemsSpec }
  | { kind: 'itemsReplace'; commandeId: string; inTx: boolean }

interface DbOpts {
  beforeWrite?: (writeCount: number) => void
}

interface Db {
  store: Store
  ops: Op[]
  findFirst: (model: 'commandes' | 'clients' | 'menuItems', where: Record<string, unknown>) => Row | null
  findManyMenuItems: (ids: string[], organizationId: string) => Row[]
  updateCommande: (where: Record<string, unknown>, data: { clientId?: string; items?: ItemsSpec }) => void
}

const ERR = {
  NOT_FOUND: 'COMMANDE_NOT_FOUND_OR_ACCESS_DENIED',
  INVALID_CLIENT: 'Invalid client for organization',
  INVALID_MENU_ITEM: 'Invalid menu item for organization',
  FAILED: 'COMMANDE_UPDATE_ERROR',
} as const

type WireResult = { ok: true } | { ok: false; error: string }

// ── Helpers ──────────────────────────────────────────────────────────────────

function matchesWhere(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, value]) => row[key] === value)
}

function seedDb(seed: {
  commandes?: Row[]
  clients?: Row[]
  menuItems?: Row[]
  items?: CommandeItemRow[]
}): Db {
  const store: Store = {
    commandes: (seed.commandes ?? []).map((r) => ({ ...r })),
    clients: (seed.clients ?? []).map((r) => ({ ...r })),
    menuItems: (seed.menuItems ?? []).map((r) => ({ ...r })),
    items: (seed.items ?? []).map((r) => ({ ...r })),
  }
  return makeDb(store, [])
}

function cloneStore(store: Store): Store {
  return {
    commandes: store.commandes.map((r) => ({ ...r })),
    clients: store.clients.map((r) => ({ ...r })),
    menuItems: store.menuItems.map((r) => ({ ...r })),
    items: store.items.map((r) => ({ ...r })),
  }
}

function makeDb(store: Store, ops: Op[], inTx = false, opts: DbOpts = {}): Db {
  let writeCount = 0
  const notifyWrite = (): void => {
    writeCount++
    if (opts.beforeWrite) opts.beforeWrite(writeCount)
  }

  return {
    store,
    ops,
    findFirst: (model, where) => store[model].find((r) => matchesWhere(r, where)) ?? null,
    findManyMenuItems: (ids, organizationId) =>
      store.menuItems.filter((r) => ids.includes(String(r.id)) && r.organizationId === organizationId),
    updateCommande: (where, data) => {
      const idx = store.commandes.findIndex((r) => matchesWhere(r, where))
      if (idx === -1) throw Object.assign(new Error('P2025: record not found'), { code: 'P2025' })
      notifyWrite()
      ops.push({ kind: 'commandeUpdate', where: { ...where }, inTx, itemsSpec: data.items })
      const next = { ...store.commandes[idx]! }
      for (const [key, value] of Object.entries(data)) {
        if (key === 'items') continue
        next[key] = value
      }
      store.commandes[idx] = next
      if (data.items !== undefined) {
        notifyWrite()
        store.items = applyItemsWrite(store.items, String(where.id), data.items)
        ops.push({ kind: 'itemsReplace', commandeId: String(where.id), inTx })
      }
    },
  }
}

function nextItemBase(items: CommandeItemRow[]): number {
  return items.reduce((max, item) => {
    const n = Number(item.id.replace('item_', ''))
    return Number.isFinite(n) ? Math.max(max, n) : max
  }, 0)
}

function applyItemsWrite(items: CommandeItemRow[], commandeId: string, spec: ItemsSpec): CommandeItemRow[] {
  if (spec === undefined) return items
  const survivors = items.filter((i) => i.commandeId !== commandeId)
  const base = nextItemBase(items)
  spec.create.forEach((create, idx) => {
    survivors.push({ id: `item_${base + idx + 1}`, commandeId, ...create })
  })
  return survivors
}

async function runTransaction(
  db: Db,
  fn: (tx: Db) => Promise<void>,
  opts: DbOpts = {},
): Promise<void> {
  const pending = cloneStore(db.store)
  const tx = makeDb(pending, db.ops, true, opts)
  await fn(tx)
  db.store = pending
}

function itemsOf(db: Db, commandeId: string): CommandeItemRow[] {
  return db.store.items.filter((i) => i.commandeId === commandeId).sort((a, b) => a.id.localeCompare(b.id))
}

// ── Handler replica (faithful to the FIXED update-commande.ts items branch) ──

function mapItemSpec(item: ItemInput): ItemCreateSpec {
  return {
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    menuItemId: item.menuItemId ?? undefined,
    notes: item.notes ?? undefined,
  }
}

async function updateCommandeItemsWire(
  db: Db,
  serverOrg: string,
  id: string,
  input: { clientId: string; items?: ItemInput[] },
  txOpts: DbOpts = {},
): Promise<WireResult> {
  try {
    const existing = db.findFirst('commandes', { id, organizationId: serverOrg })
    if (!existing) return { ok: false, error: ERR.NOT_FOUND }
    const clientRef = db.findFirst('clients', { id: input.clientId, organizationId: serverOrg })
    if (!clientRef) return { ok: false, error: ERR.INVALID_CLIENT }

    const menuItemIds = (input.items ?? [])
      .map((i) => i.menuItemId)
      .filter((x): x is string => Boolean(x))
    if (menuItemIds.length > 0) {
      const valid = db.findManyMenuItems(menuItemIds, serverOrg)
      if (valid.length !== menuItemIds.length) return { ok: false, error: ERR.INVALID_MENU_ITEM }
    }

    await runTransaction(db, async (tx) => {
      tx.updateCommande({ id, organizationId: serverOrg }, {
        clientId: input.clientId,
        items: input.items === undefined
          ? undefined
          : { deleteMany: {}, create: input.items.map(mapItemSpec) },
      })
    }, txOpts)

    return { ok: true }
  } catch {
    return { ok: false, error: ERR.FAILED }
  }
}

// ── 1. SOURCE CONTRACT ───────────────────────────────────────────────────────

describe('N-05 SOURCE CONTRACT: update-commande implements the three-state items write', () => {
  it('update-commande.ts branches on `items === undefined` and always deleteMany+create otherwise', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    assert.ok(src.includes('items: data.items === undefined'), 'must branch on undefined for no-op')
    assert.ok(src.includes('undefined'), 'omitted items must map to no item update')
    assert.ok(src.includes('deleteMany: {}'), 'non-omitted items must delete existing rows first')
    assert.ok(src.includes('create: data.items.map'), 'non-omitted items must recreate from the submitted list')
  })

  it('the old empty-array-is-noop ternary is gone', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    assert.ok(!src.includes('data.items && data.items.length > 0'), 'old noop-on-empty branch removed')
  })

  it('schema items must be optional WITHOUT a [] default so omission stays undefined', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/validations/create-commande-schema.ts'), 'utf8')
    assert.ok(src.includes('items: z.array(commandeItemSchema).optional(),'), 'items field is optional without a default')
    assert.ok(!src.includes('z.array(commandeItemSchema).optional().default([])'), 'no [] default would erase the undefined/[] distinction')
  })

  it('create-commande still normalizes an undefined items with `?? []` (create path unchanged)', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/create-commande.ts'), 'utf8')
    const occurrences = src.match(/\(data\.items \?\? \[\]\)/g) ?? []
    assert.ok(occurrences.length >= 2, 'create path handles a possibly-undefined items twice (FK check + create)')
  })
})

// ── 2. BEHAVIOR: items semantics ─────────────────────────────────────────────

const ORG_A = 'org_a'
const ORG_B = 'org_b'

describe('N-05 BEHAVIOR: update-commande items semantics', () => {
  it('items omitted → existing line items are untouched and no itemsReplace op is issued', async () => {
    const db = seedDb({
      commandes: [{ id: 'cmd1', organizationId: ORG_A, clientId: 'client_a', status: 'CONFIRMED' }],
      clients: [{ id: 'client_a', organizationId: ORG_A, name: 'client' }],
      items: [
        { id: 'item_1', commandeId: 'cmd1', name: 'Old item', quantity: 2, unitPrice: 100, totalPrice: 200 },
        { id: 'item_2', commandeId: 'cmd1', name: 'Old item 2', quantity: 1, unitPrice: 50, totalPrice: 50 },
      ],
    })
    const res = await updateCommandeItemsWire(db, ORG_A, 'cmd1', { clientId: 'client_a' })
    assert.deepEqual(res, { ok: true })
    assert.equal(itemsOf(db, 'cmd1').length, 2, 'no items were touched')
    assert.equal(db.ops.filter((o) => o.kind === 'itemsReplace').length, 0, 'no itemsReplace op for omitted items')
    assert.equal(db.store.commandes[0]!.clientId, 'client_a')
  })

  it('items = [] → all existing line items are explicitly deleted', async () => {
    const db = seedDb({
      commandes: [{ id: 'cmd1', organizationId: ORG_A, clientId: 'client_a', status: 'CONFIRMED' }],
      clients: [{ id: 'client_a', organizationId: ORG_A, name: 'client' }],
      items: [
        { id: 'item_1', commandeId: 'cmd1', name: 'Old item', quantity: 2, unitPrice: 100, totalPrice: 200 },
        { id: 'item_2', commandeId: 'cmd1', name: 'Old item 2', quantity: 1, unitPrice: 50, totalPrice: 50 },
      ],
    })
    const res = await updateCommandeItemsWire(db, ORG_A, 'cmd1', { clientId: 'client_a', items: [] })
    assert.deepEqual(res, { ok: true })
    assert.equal(itemsOf(db, 'cmd1').length, 0, 'items=[] clears every existing line item')
    const replace = db.ops.find((o) => o.kind === 'itemsReplace')
    assert.ok(replace, 'an itemsReplace op was issued for items=[]')
  })

  it('items = [a, b] → items are replaced (delete + recreate) with mapped fields', async () => {
    const db = seedDb({
      commandes: [{ id: 'cmd1', organizationId: ORG_A, clientId: 'client_a', status: 'CONFIRMED' }],
      clients: [{ id: 'client_a', organizationId: ORG_A, name: 'client' }],
      menuItems: [{ id: 'mi_1', organizationId: ORG_A }],
      items: [{ id: 'item_1', commandeId: 'cmd1', name: 'Stale', quantity: 9, unitPrice: 1, totalPrice: 9 }],
    })
    const res = await updateCommandeItemsWire(db, ORG_A, 'cmd1', {
      clientId: 'client_a',
      items: [
        { name: 'Poulet', quantity: 4, unitPrice: 250, totalPrice: 1000, menuItemId: 'mi_1', notes: 'x1' },
        { name: 'Dessert', quantity: 2, unitPrice: 80, totalPrice: 160 },
      ],
    })
    assert.deepEqual(res, { ok: true })
    const rows = itemsOf(db, 'cmd1')
    assert.equal(rows.length, 2)
    assert.deepEqual(rows[0]!, { id: 'item_2', commandeId: 'cmd1', name: 'Poulet', quantity: 4, unitPrice: 250, totalPrice: 1000, menuItemId: 'mi_1', notes: 'x1' })
    assert.deepEqual(rows[1]!, { id: 'item_3', commandeId: 'cmd1', name: 'Dessert', quantity: 2, unitPrice: 80, totalPrice: 160, menuItemId: undefined, notes: undefined })
  })

  it('items omitted preserves items even when other commande fields change', async () => {
    const db = seedDb({
      commandes: [{ id: 'cmd1', organizationId: ORG_A, clientId: 'client_a', status: 'CONFIRMED' }],
      clients: [{ id: 'client_a', organizationId: ORG_A, name: 'client' }],
      items: [{ id: 'item_1', commandeId: 'cmd1', name: 'Kept', quantity: 1, unitPrice: 10, totalPrice: 10 }],
    })
    const res = await updateCommandeItemsWire(db, ORG_A, 'cmd1', { clientId: 'client_a' })
    assert.deepEqual(res, { ok: true })
    assert.equal(itemsOf(db, 'cmd1').length, 1, 'items preserved')
    const op = db.ops.find((o) => o.kind === 'commandeUpdate')
    assert.equal(op!.itemsSpec, undefined, 'no items spec attached when items omitted')
  })
})

// ── 3. BEHAVIOR: tenant scoping unchanged ────────────────────────────────────

describe('N-05 BEHAVIOR: tenant scoping remains unchanged', () => {
  it('a cross-org commande id is rejected with zero writes and untouched items', async () => {
    const db = seedDb({
      commandes: [{ id: 'cmd1', organizationId: ORG_B, clientId: 'client_a' }],
      clients: [{ id: 'client_a', organizationId: ORG_A }],
      items: [{ id: 'item_1', commandeId: 'cmd1', name: 'Other', quantity: 1, unitPrice: 1, totalPrice: 1 }],
    })
    const res = await updateCommandeItemsWire(db, ORG_A, 'cmd1', { clientId: 'client_a', items: [] })
    assert.deepEqual(res, { ok: false, error: ERR.NOT_FOUND })
    assert.equal(db.ops.length, 0, 'no mutation issued')
    assert.equal(itemsOf(db, 'cmd1').length, 1)
  })

  it('a cross-org client id is rejected before any transaction work', async () => {
    const db = seedDb({
      commandes: [{ id: 'cmd1', organizationId: ORG_A, clientId: 'client_a' }],
      clients: [{ id: 'client_a', organizationId: ORG_B }],
    })
    const res = await updateCommandeItemsWire(db, ORG_A, 'cmd1', { clientId: 'client_a', items: [] })
    assert.deepEqual(res, { ok: false, error: ERR.INVALID_CLIENT })
    assert.equal(db.ops.length, 0)
  })

  it('a cross-org menuItemId inside items is rejected with zero writes', async () => {
    const db = seedDb({
      commandes: [{ id: 'cmd1', organizationId: ORG_A, clientId: 'client_a' }],
      clients: [{ id: 'client_a', organizationId: ORG_A }],
      menuItems: [{ id: 'mi_1', organizationId: ORG_B }],
      items: [{ id: 'item_1', commandeId: 'cmd1', name: 'Old', quantity: 1, unitPrice: 1, totalPrice: 1 }],
    })
    const res = await updateCommandeItemsWire(db, ORG_A, 'cmd1', {
      clientId: 'client_a',
      items: [{ name: 'Sneaky', quantity: 1, unitPrice: 1, totalPrice: 1, menuItemId: 'mi_1' }],
    })
    assert.deepEqual(res, { ok: false, error: ERR.INVALID_MENU_ITEM })
    assert.equal(db.ops.length, 0)
    assert.equal(itemsOf(db, 'cmd1').length, 1, 'existing items untouched')
  })

  it('the commande.update where predicate carries exactly the server-derived org', async () => {
    const db = seedDb({
      commandes: [{ id: 'cmd1', organizationId: ORG_A, clientId: 'client_a' }],
      clients: [{ id: 'client_a', organizationId: ORG_A }],
    })
    const res = await updateCommandeItemsWire(db, ORG_A, 'cmd1', { clientId: 'client_a', items: [] })
    assert.deepEqual(res, { ok: true })
    const op = db.ops.find((o) => o.kind === 'commandeUpdate')
    assert.ok(op)
    assert.deepEqual(op!.where, { id: 'cmd1', organizationId: ORG_A })
  })

  it('org is never taken from input — a crafted extra field is ignored', async () => {
    const db = seedDb({
      commandes: [{ id: 'cmd1', organizationId: ORG_A, clientId: 'client_a' }],
      clients: [{ id: 'client_a', organizationId: ORG_A }],
    })
    // The replica never reads an organizationId from `input`; only the
    // server-derived org is ever part of the write predicate.
    const res = await updateCommandeItemsWire(db, ORG_A, 'cmd1', { clientId: 'client_a' })
    assert.deepEqual(res, { ok: true })
    const op = db.ops.find((o) => o.kind === 'commandeUpdate')
    assert.deepEqual(op!.where, { id: 'cmd1', organizationId: ORG_A })
  })
})

// ── 4. BEHAVIOR: transaction behavior unchanged ──────────────────────────────

describe('N-05 BEHAVIOR: transaction behavior remains unchanged', () => {
  it('the items write runs inside the transaction', async () => {
    const db = seedDb({
      commandes: [{ id: 'cmd1', organizationId: ORG_A, clientId: 'client_a' }],
      clients: [{ id: 'client_a', organizationId: ORG_A }],
      items: [{ id: 'item_1', commandeId: 'cmd1', name: 'Old', quantity: 1, unitPrice: 1, totalPrice: 1 }],
    })
    const res = await updateCommandeItemsWire(db, ORG_A, 'cmd1', { clientId: 'client_a', items: [] })
    assert.deepEqual(res, { ok: true })
    const replace = db.ops.find((o) => o.kind === 'itemsReplace')!
    const update = db.ops.find((o) => o.kind === 'commandeUpdate')!
    assert.equal(replace.inTx, true, 'itemsReplace op runs inside the transaction')
    assert.equal(update.inTx, true, 'commande.update runs inside the transaction')
  })

  it('a failure inside the transaction rolls back both the item replacement and the commande update', async () => {
    const db = seedDb({
      commandes: [{ id: 'cmd1', organizationId: ORG_A, clientId: 'client_a', status: 'CONFIRMED' }],
      clients: [{ id: 'client_a', organizationId: ORG_A }],
      items: [{ id: 'item_1', commandeId: 'cmd1', name: 'Original', quantity: 1, unitPrice: 1, totalPrice: 1 }],
    })
    // Fail AFTER the first write lands on the pending clone (partial tx work done).
    const res = await updateCommandeItemsWire(db, ORG_A, 'cmd1', {
      clientId: 'client_a',
      items: [{ name: 'Replacement', quantity: 2, unitPrice: 3, totalPrice: 6 }],
    }, { beforeWrite: (n) => { if (n >= 2) throw new Error('simulated DB failure inside tx') } })
    assert.deepEqual(res, { ok: false, error: ERR.FAILED })
    assert.equal(itemsOf(db, 'cmd1').length, 1, 'items rolled back')
    assert.equal(itemsOf(db, 'cmd1')[0]!.name, 'Original', 'original item preserved after rollback')
    assert.equal(db.store.commandes[0]!.status, 'CONFIRMED', 'commande state preserved after rollback')
  })
})