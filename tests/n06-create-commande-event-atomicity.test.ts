/**
 * N-06 create/update-commande Event atomicity — Unit Tests
 *
 * Finding N-4 (CONFIRMED RELIABILITY ISSUE): create-commande.ts and
 * update-commande.ts created the automatic Event with `prisma.event.create`
 * BEFORE the Commande transaction. On a failed/aborted transaction the Event
 * could persist as an orphan, and user-level resubmission could duplicate it.
 *
 * Fix:
 *   - create-commande.ts: automatic Event creation moved INSIDE the existing
 *     `$transaction` (per retry attempt) using `tx.event.create`. Rollback or
 *     P2002 retry now discards that attempt's Event atomically.
 *   - update-commande.ts: same minimal correction for its automatic creation
 *     path. The pre-existing `prisma.event.update` branch is preserved as-is.
 *
 * This file follows the tests/b01..n05 conventions: dependency-injected
 * replicas + fs source-contract checks — no @clerk/@prisma imports, no DB.
 *
 * Run: npx tsx tests/n06-create-commande-event-atomicity.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── Types ────────────────────────────────────────────────────────────────────

interface EventRow {
  id: string
  organizationId: string
  clientId: string
  name: string
  type: string
  status: string
  startDate: Date
  endDate: Date
  location?: string
  guestCount?: number
  budget?: number
  contactPerson?: string
  contactPhone?: string
  notes?: string
}

interface CommandeRow {
  id: string
  organizationId: string
  createdById?: string
  clientId: string
  eventId: string | null
  number: string
  status: string
  totalAmount: number
}

interface CounterRow {
  organizationId: string
  year: number
  lastNumber: number
}

type Row = Record<string, unknown>

interface Store {
  events: EventRow[]
  commandes: CommandeRow[]
  counters: CounterRow[]
  clients: Row[]
  menus: Row[]
  menuItems: Row[]
}

type Op =
  | { kind: 'eventCreate'; inTx: boolean }
  | { kind: 'commandeCreate'; inTx: boolean }
  | { kind: 'eventUpdate'; inTx: boolean }
  | { kind: 'commandeUpdate'; inTx: boolean }

interface TxOpts {
  beforeCommandeCreate?: () => void
  beforeCommandeUpdate?: () => void
}

interface Tx {
  eventCreate(input: {
    organizationId: string
    clientId: string
    name: string
    type: string
    status: string
    startDate: Date
    endDate: Date
    location?: string
    guestCount?: number
    budget?: number
    contactPerson?: string
    contactPhone?: string
    notes?: string
  }): string
  commandeCreate(data: {
    organizationId: string
    createdById?: string
    clientId: string
    number: string
    eventId: string | null
    status: string
    totalAmount?: number
  }): CommandeRow
  commandeUpdate(
    where: { id: string; organizationId: string },
    data: { clientId?: string; eventId?: string | null; status?: string },
  ): void
}

interface Db {
  store: Store
  ops: Op[]
  findFirst(model: 'clients' | 'events' | 'menus', where: Record<string, unknown>): Row | null
  findManyMenuItems(ids: string[], organizationId: string): Row[]
  eventUpdate(id: string, patch: Partial<EventRow>): void
  nextCommandeNumber(organizationId: string): string
}

const ERR = {
  INVALID_CLIENT: 'Invalid client for organization',
  INVALID_EVENT: 'Invalid event for organization',
  INVALID_MENU: 'Invalid menu for organization',
  INVALID_MENU_ITEM: 'Invalid menu item for organization',
  NOT_FOUND: 'COMMANDE_NOT_FOUND_OR_ACCESS_DENIED',
  CREATE_FAILED: 'create failed',
  CREATE_RETRIES: 'retries exhausted',
  UPDATE_FAILED: 'update failed',
} as const

type WireResult = { ok: true } | { ok: false; error: string }

// ── Store helpers ────────────────────────────────────────────────────────────

function matchesWhere(row: Row | undefined, where: Record<string, unknown>): boolean {
  if (!row) return false
  return Object.entries(where).every(([key, value]) => row[key] === value)
}

function cloneStore(store: Store): Store {
  return {
    events: store.events.map((r) => ({ ...r, startDate: new Date(r.startDate), endDate: new Date(r.endDate) })),
    commandes: store.commandes.map((r) => ({ ...r })),
    counters: store.counters.map((r) => ({ ...r })),
    clients: store.clients.map((r) => ({ ...r })),
    menus: store.menus.map((r) => ({ ...r })),
    menuItems: store.menuItems.map((r) => ({ ...r })),
  }
}

function seedDb(seed: {
  events?: EventRow[]
  commandes?: CommandeRow[]
  counters?: CounterRow[]
  clients?: Row[]
  menus?: Row[]
  menuItems?: Row[]
}): SeededDb {
  const store = cloneStore({
    events: seed.events ?? [],
    commandes: seed.commandes ?? [],
    counters: seed.counters ?? [],
    clients: seed.clients ?? [],
    menus: seed.menus ?? [],
    menuItems: seed.menuItems ?? [],
  })

  let evtSeq = 0
  let cmdSeq = 0
  const ops: Op[] = []

  const db: Db = {
    store,
    ops,
    findFirst: (model, where) => {
      const rows = store[model] as unknown as Row[]
      return rows.find((r) => matchesWhere(r, where)) ?? null
    },
    findManyMenuItems: (ids, organizationId) =>
      store.menuItems.filter((r) => ids.includes(String(r.id)) && r.organizationId === organizationId),
    eventUpdate: (id, patch) => {
      const row = store.events.find((e) => e.id === id)
      if (!row) throw Object.assign(new Error('P2025: record not found'), { code: 'P2025' })
      Object.assign(row, patch)
      ops.push({ kind: 'eventUpdate', inTx: false })
    },
    nextCommandeNumber: (organizationId) => {
      const year = new Date().getFullYear()
      const row = store.counters.find((c) => c.organizationId === organizationId && c.year === year)
      if (!row) {
        store.counters.push({ organizationId, year, lastNumber: 1 })
        return `CMD-${year}-0001`
      }
      row.lastNumber += 1
      return `CMD-${year}-${String(row.lastNumber).padStart(4, '0')}`
    },
  }

  function makeTx(pending: Store, localOps: Op[], txOpts: TxOpts): Tx {
    return {
      eventCreate(input) {
        evtSeq += 1
        const event: EventRow = { id: `evt_${evtSeq}`, ...input }
        pending.events.push(event)
        localOps.push({ kind: 'eventCreate', inTx: true })
        return event.id
      },
      commandeCreate(data) {
        if (txOpts.beforeCommandeCreate) txOpts.beforeCommandeCreate()
        const dup = pending.commandes.find(
          (c) => c.organizationId === data.organizationId && c.number === data.number,
        )
        if (dup) throw Object.assign(new Error('unique constraint violated'), { code: 'P2002' })
        cmdSeq += 1
        const row: CommandeRow = { ...data, id: `cmd_${cmdSeq}`, totalAmount: data.totalAmount ?? 0, status: data.status }
        pending.commandes.push(row)
        localOps.push({ kind: 'commandeCreate', inTx: true })
        return row
      },
      commandeUpdate(where, data) {
        if (txOpts.beforeCommandeUpdate) txOpts.beforeCommandeUpdate()
        const idx = pending.commandes.findIndex((c) => matchesWhere(c as unknown as Row, where))
        if (idx === -1) throw Object.assign(new Error('P2025: record not found'), { code: 'P2025' })
        pending.commandes[idx] = { ...pending.commandes[idx], ...data }
        localOps.push({ kind: 'commandeUpdate', inTx: true })
      },
    }
  }

  async function runTransaction<T>(fn: (tx: Tx) => T | Promise<T>, txOpts: TxOpts = {}): Promise<T> {
    const pending = cloneStore(store)
    const localOps: Op[] = []
    const tx = makeTx(pending, localOps, txOpts)
    const result = await fn(tx)
    // Commit only on success — a throw above discards `pending` (rollback).
    store.events = pending.events
    store.commandes = pending.commandes
    ops.push(...localOps)
    return result
  }

  return Object.assign(db, { _runTransaction: runTransaction })
}

type SeededDb = Db & { _runTransaction: <T>(fn: (tx: Tx) => T | Promise<T>, txOpts?: TxOpts) => Promise<T> }

// ── create-commande replica (faithful to the FIXED action) ───────────────────

interface CreateInput {
  clientId: string
  eventId?: string
  menuId?: string
  menuItemIds?: string[]
  items?: Array<{ menuItemId?: string | null }>
  number?: string
  status?: string
  totalAmount?: number
  eventDate?: string
  eventName?: string
  eventType?: string
  eventStatus?: string
  location?: string
  guestCount?: number
  clientBudget?: number
  contactName?: string
  contactPhone?: string
  notes?: string
}

const MAX_NUMBER_RETRIES = 5

function isPrismaP2002(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002'
}

async function createCommandeWire(
  db: SeededDb,
  serverOrg: string,
  userId: string | undefined,
  input: CreateInput,
  txOpts: TxOpts = {},
): Promise<WireResult> {
  const data = input

  if (!db.findFirst('clients', { id: data.clientId, organizationId: serverOrg })) {
    return { ok: false, error: ERR.INVALID_CLIENT }
  }
  if (data.eventId && !db.findFirst('events', { id: data.eventId, organizationId: serverOrg })) {
    return { ok: false, error: ERR.INVALID_EVENT }
  }
  if (data.menuId && !db.findFirst('menus', { id: data.menuId, organizationId: serverOrg })) {
    return { ok: false, error: ERR.INVALID_MENU }
  }
  const menuItemIds = (data.items ?? [])
    .map((i) => i.menuItemId)
    .filter((id): id is string => Boolean(id))
  if (menuItemIds.length > 0) {
    const valid = db.findManyMenuItems(menuItemIds, serverOrg)
    if (valid.length !== menuItemIds.length) return { ok: false, error: ERR.INVALID_MENU_ITEM }
  }

  const resolvedEventId = data.eventId ?? null
  for (let attempt = 0; attempt < MAX_NUMBER_RETRIES; attempt++) {
    try {
      await db._runTransaction(async (tx) => {
        const number = data.number ?? db.nextCommandeNumber(serverOrg)

        let eventId = resolvedEventId
        if (!eventId && data.eventDate) {
          const startDate = new Date(data.eventDate)
          const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000)
          eventId = tx.eventCreate({
            organizationId: serverOrg,
            clientId: data.clientId,
            name: data.eventName ?? `Événement - ${data.number ?? 'Nouveau'}`,
            type: data.eventType ?? 'OTHER',
            status: data.eventStatus ?? 'CONFIRMED',
            startDate,
            endDate,
            location: data.location ?? undefined,
            guestCount: data.guestCount ?? undefined,
            budget: data.clientBudget ?? undefined,
            contactPerson: data.contactName ?? undefined,
            contactPhone: data.contactPhone ?? undefined,
            notes: data.notes ?? undefined,
          })
        }

        return tx.commandeCreate({
          organizationId: serverOrg,
          createdById: userId,
          clientId: data.clientId,
          number,
          eventId,
          status: data.status ?? 'DRAFT',
          totalAmount: data.totalAmount ?? 0,
        })
      }, txOpts)

      return { ok: true }
    } catch (err: unknown) {
      if (isPrismaP2002(err) && !data.number) {
        continue
      }
      return { ok: false, error: ERR.CREATE_FAILED }
    }
  }

  return { ok: false, error: ERR.CREATE_RETRIES }
}

// ── update-commande replica (faithful to the FIXED action) ───────────────────

type UpdateInput = CreateInput

async function updateCommandeWire(
  db: SeededDb,
  serverOrg: string,
  id: string,
  input: UpdateInput,
  txOpts: TxOpts = {},
): Promise<WireResult> {
  const data = input
  const existing = db.store.commandes.find((c) => c.id === id && c.organizationId === serverOrg)
  if (!existing) {
    return { ok: false, error: ERR.NOT_FOUND }
  }

  if (!db.findFirst('clients', { id: data.clientId, organizationId: serverOrg })) {
    return { ok: false, error: ERR.INVALID_CLIENT }
  }

  let resolvedEventId = existing.eventId

  if (data.eventId) {
    if (!db.findFirst('events', { id: data.eventId, organizationId: serverOrg })) {
      return { ok: false, error: ERR.INVALID_EVENT }
    }
    resolvedEventId = data.eventId
  }

  if (resolvedEventId && data.eventDate) {
    db.eventUpdate(resolvedEventId, {
      name: data.eventName ?? undefined,
      type: data.eventType ?? undefined,
      status: data.eventStatus ?? undefined,
      startDate: data.eventDate ? new Date(data.eventDate) : undefined,
      location: data.location ?? undefined,
      guestCount: data.guestCount ?? undefined,
      budget: data.clientBudget ?? undefined,
      contactPerson: data.contactName ?? undefined,
      contactPhone: data.contactPhone ?? undefined,
      notes: data.notes ?? undefined,
    })
  }

  try {
    await db._runTransaction(async (tx) => {
      let eventId = resolvedEventId
      if (!eventId && data.eventDate) {
        const startDate = new Date(data.eventDate)
        const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000)
        eventId = tx.eventCreate({
          organizationId: serverOrg,
          clientId: data.clientId,
          name: data.eventName ?? `Événement - ${data.number}`,
          type: data.eventType ?? 'OTHER',
          status: data.eventStatus ?? 'CONFIRMED',
          startDate,
          endDate,
          location: data.location ?? undefined,
          guestCount: data.guestCount ?? undefined,
          budget: data.clientBudget ?? undefined,
          contactPerson: data.contactName ?? undefined,
          contactPhone: data.contactPhone ?? undefined,
          notes: data.notes ?? undefined,
        })
      }

      tx.commandeUpdate(
        { id, organizationId: serverOrg },
        { clientId: data.clientId, eventId, status: data.status ?? existing.status },
      )
    }, txOpts)

    return { ok: true }
  } catch {
    return { ok: false, error: ERR.UPDATE_FAILED }
  }
}

// ── Shared fixture helpers ────────────────────────────────────────────────────

const ORG_A = 'org_a'

function eventDateInput(): string {
  return '2026-05-01T10:00:00.000Z'
}

function baseSeedClients(): Row[] {
  return [{ id: 'client_a', organizationId: ORG_A, name: 'Amina' }]
}

function createdEventOf(db: SeededDb): EventRow {
  const events = db.store.events
  assert.equal(events.length, 1, 'exactly one event expected')
  return events[0]!
}

// ── 1. SOURCE CONTRACT ───────────────────────────────────────────────────────

describe('N-06 SOURCE CONTRACT: automatic Event creation is inside the transaction', () => {
  it('create-commande.ts uses tx.event.create inside $transaction and never prisma.event.create', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/create-commande.ts'), 'utf8')
    assert.ok(!src.includes('prisma.event.create'), 'no automatic Event create may run outside the transaction')
    assert.ok(src.includes('await tx.event.create'), 'automatic Event creation uses the transaction client')
    assert.ok(src.includes('prisma.$transaction(async (tx)'), 'single interactive transaction present')
    assert.equal((src.match(/prisma\.\$transaction\(/g) ?? []).length, 1, 'no nested $transaction')
    const txIdx = src.indexOf('prisma.$transaction(async (tx)')
    const eventCreateIdx = src.indexOf('await tx.event.create')
    const commandeCreateIdx = src.indexOf('await tx.commande.create')
    assert.ok(txIdx !== -1 && eventCreateIdx !== -1 && commandeCreateIdx !== -1)
    assert.ok(txIdx < eventCreateIdx && eventCreateIdx < commandeCreateIdx, 'event + commande writes both inside the tx, event first')
    assert.ok(src.includes('const resolvedEventId = data.eventId ?? null'), 'no Event creation happens before the retry loop')
  })

  it('update-commande.ts uses tx.event.create, keeps prisma.event.update, has no prisma.event.create', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    assert.ok(!src.includes('prisma.event.create'), 'no automatic Event create may run outside the transaction')
    assert.ok(src.includes('await tx.event.create'), 'automatic Event creation uses the transaction client')
    assert.ok(src.includes('await prisma.event.update'), 'existing linked-event update behavior preserved')
    assert.equal((src.match(/prisma\.\$transaction\(/g) ?? []).length, 1, 'no nested $transaction')
    const txIdx = src.indexOf('prisma.$transaction(async (tx)')
    const eventCreateIdx = src.indexOf('await tx.event.create')
    const commandeUpdateIdx = src.indexOf('await tx.commande.update')
    assert.ok(txIdx !== -1 && eventCreateIdx !== -1 && commandeUpdateIdx !== -1)
    assert.ok(txIdx < eventCreateIdx && eventCreateIdx < commandeUpdateIdx, 'event create inside tx, before the commande update')
  })
})

// ── 2. BEHAVIOR: create-commande ─────────────────────────────────────────────

describe('N-06 BEHAVIOR: create-commande Event atomicity', () => {
  it('auto-created Event on a successful create is persisted and linked to the Commande', async () => {
    const db = seedDb({ clients: baseSeedClients() })
    const res = await createCommandeWire(db, ORG_A, 'user_1', {
      clientId: 'client_a',
      eventDate: eventDateInput(),
      eventName: 'Mariage Amine',
      eventType: 'WEDDING',
      eventStatus: 'CONFIRMED',
      location: 'Casablanca',
      guestCount: 120,
      clientBudget: 60000,
      totalAmount: 60000,
    })
    assert.deepEqual(res, { ok: true })
    const event = createdEventOf(db)
    assert.equal(event.organizationId, ORG_A)
    assert.equal(event.clientId, 'client_a')
    assert.equal(event.name, 'Mariage Amine')
    assert.equal(event.type, 'WEDDING')
    assert.equal(event.status, 'CONFIRMED')
    assert.equal(event.location, 'Casablanca')
    assert.equal(event.guestCount, 120)
    assert.equal(event.budget, 60000)
    assert.equal(event.startDate.toISOString(), eventDateInput())
    assert.equal(event.endDate.getTime() - event.startDate.getTime(), 4 * 60 * 60 * 1000, 'default +4h endDate')
    assert.equal(db.store.commandes.length, 1)
    assert.equal(db.store.commandes[0]!.eventId, event.id, 'Commande is linked to the created Event')
    assert.equal(db.ops.find((o) => o.kind === 'eventCreate')?.inTx, true, 'Event creation ran inside the transaction')
  })

  it('a transaction failure after Event creation leaves zero persisted auto-created Events', async () => {
    const db = seedDb({ clients: baseSeedClients() })
    const res = await createCommandeWire(
      db,
      ORG_A,
      'user_1',
      { clientId: 'client_a', eventDate: eventDateInput(), eventName: 'Gala' },
      { beforeCommandeCreate: () => { throw new Error('simulated DB failure inside tx') } },
    )
    assert.deepEqual(res, { ok: false, error: ERR.CREATE_FAILED })
    assert.equal(db.store.events.length, 0, 'rolled-back Event must not persist')
    assert.equal(db.store.commandes.length, 0, 'no Commande was created')
  })

  it('client-provided data.number causing P2002 returns an error and leaves zero auto-created Events', async () => {
    const db = seedDb({
      clients: baseSeedClients(),
      commandes: [{ id: 'cmd_x', organizationId: ORG_A, clientId: 'client_a', eventId: null, number: 'CMD-2026-0001', status: 'DRAFT', totalAmount: 0 }],
    })
    const res = await createCommandeWire(db, ORG_A, 'user_1', {
      clientId: 'client_a',
      number: 'CMD-2026-0001',
      eventDate: eventDateInput(),
      eventName: 'Collision',
    })
    assert.deepEqual(res, { ok: false, error: ERR.CREATE_FAILED })
    assert.equal(db.store.events.length, 0, 'P2002 attempt rolled back its Event')
    assert.equal(db.store.commandes.length, 1, 'only the pre-existing Commande remains')
  })

  it('a P2002 retry where the first attempt fails leaves exactly one Event linked to the surviving Commande', async () => {
    const db = seedDb({ clients: baseSeedClients() })
    let attempts = 0
    const res = await createCommandeWire(
      db,
      ORG_A,
      'user_1',
      { clientId: 'client_a', eventDate: eventDateInput(), eventName: 'Mariage Retry' },
      {
        beforeCommandeCreate: () => {
          attempts += 1
          if (attempts === 1) throw Object.assign(new Error('unique constraint violated'), { code: 'P2002' })
        },
      },
    )
    assert.deepEqual(res, { ok: true })
    assert.equal(attempts, 2, 'first attempt failed, second attempt succeeded')
    assert.equal(db.store.events.length, 1, 'exactly one Event survives the retry')
    assert.equal(db.store.commandes.length, 1)
    assert.equal(db.store.commandes[0]!.eventId, db.store.events[0]!.id, 'surviving Commande links the surviving Event')
    assert.equal(db.store.commandes[0]!.number, 'CMD-2026-0002', 'retry used a fresh server-generated number')
  })

  it('a provided eventId creates no new Event (regardless of eventDate)', async () => {
    const db = seedDb({
      clients: baseSeedClients(),
      events: [{ id: 'evt_1', organizationId: ORG_A, clientId: 'client_a', name: 'Existing', type: 'OTHER', status: 'CONFIRMED', startDate: new Date(eventDateInput()), endDate: new Date(eventDateInput()) }],
    })
    const res = await createCommandeWire(db, ORG_A, 'user_1', {
      clientId: 'client_a',
      eventId: 'evt_1',
      eventDate: eventDateInput(),
      eventName: 'Ignored for create',
    })
    assert.deepEqual(res, { ok: true })
    assert.equal(db.store.events.length, 1, 'no new Event created for a provided eventId')
    assert.equal(db.store.commandes[0]!.eventId, 'evt_1', 'existing Event is linked')
  })
})

// ── 3. BEHAVIOR: update-commande ─────────────────────────────────────────────

describe('N-06 BEHAVIOR: update-commande Event atomicity', () => {
  it('update auto-creates the Event inside the transaction and links it on success', async () => {
    const db = seedDb({
      clients: baseSeedClients(),
      commandes: [{ id: 'cmd_1', organizationId: ORG_A, clientId: 'client_a', eventId: null, number: 'CMD-2026-0001', status: 'DRAFT', totalAmount: 1000 }],
    })
    const res = await updateCommandeWire(db, ORG_A, 'cmd_1', {
      clientId: 'client_a',
      eventDate: eventDateInput(),
      eventName: 'Gala Update',
      status: 'CONFIRMED',
    })
    assert.deepEqual(res, { ok: true })
    const event = createdEventOf(db)
    assert.equal(event.name, 'Gala Update')
    assert.equal(event.type, 'OTHER')
    assert.equal(event.status, 'CONFIRMED')
    assert.equal(db.store.commandes[0]!.eventId, event.id, 'updated Commande links the created Event')
    assert.equal(db.store.commandes[0]!.status, 'CONFIRMED')
    assert.equal(db.ops.find((o) => o.kind === 'eventCreate')?.inTx, true)
  })

  it('update rollback after a transaction failure leaves zero new Events and the Commande untouched', async () => {
    const db = seedDb({
      clients: baseSeedClients(),
      commandes: [{ id: 'cmd_1', organizationId: ORG_A, clientId: 'client_a', eventId: null, number: 'CMD-2026-0001', status: 'DRAFT', totalAmount: 1000 }],
    })
    const res = await updateCommandeWire(
      db,
      ORG_A,
      'cmd_1',
      { clientId: 'client_a', eventDate: eventDateInput(), eventName: 'Stale', status: 'CONFIRMED' },
      { beforeCommandeUpdate: () => { throw new Error('simulated failure inside tx') } },
    )
    assert.deepEqual(res, { ok: false, error: ERR.UPDATE_FAILED })
    assert.equal(db.store.events.length, 0, 'no orphan Event after rollback')
    assert.equal(db.store.commandes[0]!.eventId, null, 'Commande link unchanged')
    assert.equal(db.store.commandes[0]!.status, 'DRAFT', 'Commande state unchanged')
  })

  it('update with a provided eventId + eventDate updates the existing Event (outside tx, preserved) and does not create one', async () => {
    const db = seedDb({
      clients: baseSeedClients(),
      commandes: [{ id: 'cmd_1', organizationId: ORG_A, clientId: 'client_a', eventId: 'evt_1', number: 'CMD-2026-0001', status: 'DRAFT', totalAmount: 1000 }],
      events: [{ id: 'evt_1', organizationId: ORG_A, clientId: 'client_a', name: 'Old Name', type: 'OTHER', status: 'DRAFT', startDate: new Date(eventDateInput()), endDate: new Date(eventDateInput()) }],
    })
    const res = await updateCommandeWire(db, ORG_A, 'cmd_1', {
      clientId: 'client_a',
      eventId: 'evt_1',
      eventDate: eventDateInput(),
      eventName: 'New Name',
      status: 'CONFIRMED',
    })
    assert.deepEqual(res, { ok: true })
    assert.equal(db.store.events.length, 1, 'no new Event created')
    assert.equal(db.store.events[0]!.name, 'New Name', 'existing linked Event was updated')
    assert.equal(db.store.commandes[0]!.eventId, 'evt_1')
    assert.equal(db.ops.find((o) => o.kind === 'eventUpdate')?.inTx, false, 'event update runs outside the tx (preserved)')
  })
})