/**
 * HIGH-05 (frontend): edit-form hydration uses persisted prices
 *
 * Bug: `use-edit-commande-form` hydrated `selected` with `{id, qty, note}`
 * only, then re-joined each id against the LIVE catalog — so an existing
 * item (persisted 100 MAD, catalog now 179 MAD, qty 34) displayed
 * 34 × 179 = 6086 instead of 34 × 100 = 3400.
 *
 * Fix: hydration carries `unitPrice`/`name` from the persisted CommandeItem
 * and the `selectedList` join prefers them; the catalog price applies only
 * to genuinely new selections. Server-side HIGH-05 protection in
 * update-commande.ts is untouched (verified below).
 *
 * Run: npx tsx tests/high-05-edit-form-hydration.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── Types mirroring the form ───────────────────────────────────────

interface PersistedItem {
  menuItemId: string | null
  name: string
  quantity: number
  unitPrice: number
  notes: string | null
}

interface SelectedEntry {
  id: string
  qty: number
  note?: string
  unitPrice?: number
  name?: string
}

interface CatalogItem {
  id: string
  name: string
  price: number
}

// ── Replicas mirroring use-edit-commande-form.ts ───────────────────

function hydrateSelected(items: PersistedItem[]): Record<string, SelectedEntry> {
  const initial: Record<string, SelectedEntry> = {}
  for (const item of items) {
    const id = item.menuItemId ?? item.name
    initial[id] = {
      id,
      qty: item.quantity,
      note: item.notes ?? '',
      unitPrice: Number(item.unitPrice),
      name: item.name,
    }
  }
  return initial
}

function joinSelectedList(
  selected: Record<string, SelectedEntry>,
  menuItems: CatalogItem[],
): Array<{ qty: number; name: string; price: number }> {
  return Object.values(selected)
    .filter((s) => s.qty > 0)
    .map((s) => {
      const item = menuItems.find((m) => m.id === s.id)
      const price = s.unitPrice ?? item?.price ?? 0
      const name = s.name ?? item?.name ?? 'Inconnu'
      return { qty: s.qty, name, price }
    })
}

function applyPack(packItemIds: string[], qty: number): Record<string, SelectedEntry> {
  const next: Record<string, SelectedEntry> = {}
  packItemIds.forEach((id) => { next[id] = { id, qty } })
  return next
}

// ── Fixtures: the reported bug ─────────────────────────────────────

const CATALOG: CatalogItem[] = [{ id: 'mi_bastila', name: 'bastila hoot', price: 179 }]
const PERSISTED: PersistedItem[] = [{
  menuItemId: 'mi_bastila', name: 'bastila hoot', quantity: 34, unitPrice: 100, notes: null,
}]

// ── A–E: hydration behavior ────────────────────────────────────────

describe('HIGH-05 HYDRATION: persisted price wins in the edit form', () => {
  it('A. persisted 100 + catalog 179 → edit form shows 100', () => {
    const rows = joinSelectedList(hydrateSelected(PERSISTED), CATALOG)
    assert.equal(rows.length, 1)
    assert.equal(rows[0]!.price, 100, 'historical price displayed, not catalog')
    assert.equal(rows[0]!.name, 'bastila hoot')
  })

  it('B. qty 34 × persisted 100 → line total 3400', () => {
    const rows = joinSelectedList(hydrateSelected(PERSISTED), CATALOG)
    assert.equal(rows[0]!.qty * rows[0]!.price, 3400)
  })

  it('C. changing the catalog price does not change the hydrated price', () => {
    const selected = hydrateSelected(PERSISTED)
    const before = joinSelectedList(selected, CATALOG)
    const repricedCatalog: CatalogItem[] = [{ id: 'mi_bastila', name: 'bastila hoot', price: 250 }]
    const after = joinSelectedList(selected, repricedCatalog)
    assert.equal(before[0]!.price, 100)
    assert.equal(after[0]!.price, 100, 're-render against a new catalog keeps history')
  })

  it('D. a genuinely new catalog item still initializes from the catalog price', () => {
    const selected: Record<string, SelectedEntry> = {
      ...hydrateSelected(PERSISTED),
      mi_new: { id: 'mi_new', qty: 2 },
    }
    const catalog: CatalogItem[] = [
      ...CATALOG,
      { id: 'mi_new', name: 'Salade', price: 179 },
    ]
    const rows = joinSelectedList(selected, catalog)
    const fresh = rows.find((r) => r.name === 'Salade')!
    assert.equal(fresh.price, 179, 'new selection takes the current catalog price')
    assert.equal(rows.find((r) => r.name === 'bastila hoot')!.price, 100, 'existing row unaffected')
  })

  it('E. custom/non-catalog existing items retain persisted price (never dropped, never repriced)', () => {
    const custom: PersistedItem[] = [{
      menuItemId: null, name: 'Service traiteur', quantity: 1, unitPrice: 2000, notes: null,
    }]
    const rows = joinSelectedList(hydrateSelected(custom), CATALOG)
    assert.equal(rows.length, 1, 'custom row is kept, not removed')
    assert.equal(rows[0]!.price, 2000, 'historical custom price kept (not 0, not a catalog price)')
    assert.equal(rows[0]!.name, 'Service traiteur')
  })

  it('a free (0 MAD) persisted item keeps 0 and does not fall through to catalog', () => {
    const free: PersistedItem[] = [{
      menuItemId: 'mi_bastila', name: 'bastila hoot', quantity: 2, unitPrice: 0, notes: null,
    }]
    const rows = joinSelectedList(hydrateSelected(free), CATALOG)
    assert.equal(rows[0]!.price, 0, '?? (not ||) preserves a genuine zero price')
  })
})

// ── F–G: save path + applyPack ─────────────────────────────────────

describe('HIGH-05 HYDRATION: save path and applyPack', () => {
  it('F. the update payload carries the persisted price for existing rows', () => {
    const rows = joinSelectedList(hydrateSelected(PERSISTED), CATALOG)
    const payload = rows.map((r) => ({
      name: r.name, quantity: r.qty, unitPrice: r.price, totalPrice: r.price * r.qty,
    }))
    assert.equal(payload[0]!.unitPrice, 100)
    assert.equal(payload[0]!.totalPrice, 3400)
  })

  it('G. applyPack still selects catalog items at catalog prices', () => {
    const selected = applyPack(['mi_bastila'], 10)
    const rows = joinSelectedList(selected, CATALOG)
    assert.equal(rows[0]!.price, 179, 'pack application is an explicit catalog selection')
    assert.equal(rows[0]!.qty, 10)
  })

  it('qty/note edits preserve the carried persisted price', () => {
    const selected = hydrateSelected(PERSISTED)
    const edited: Record<string, SelectedEntry> = {
      ...selected,
      mi_bastila: { ...selected['mi_bastila']!, qty: 40, note: 'extra' },
    }
    const rows = joinSelectedList(edited, CATALOG)
    assert.equal(rows[0]!.price, 100, 'price survives qty/note edits')
    assert.equal(rows[0]!.qty * rows[0]!.price, 4000)
  })
})

// ── Source contract ────────────────────────────────────────────────

describe('HIGH-05 HYDRATION SOURCE CONTRACT', () => {
  it('edit hook hydrates selected entries with persisted unitPrice/name', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-edit-commande-form.ts'), 'utf8')
    assert.ok(src.includes('unitPrice: Number(item.unitPrice)'), 'hydration carries persisted price')
    assert.ok(src.includes('name: item.name'), 'hydration carries persisted name')
  })

  it('selectedList prefers the carried price over the catalog price', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-edit-commande-form.ts'), 'utf8')
    assert.ok(src.includes('s.unitPrice ?? item?.price'), 'persisted-first price resolution')
    assert.ok(src.includes('s.name ?? item?.name'), 'persisted-first name resolution')
  })

  it('SelectedItem carries the optional snapshot fields', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/data/mock-data.ts'), 'utf8')
    assert.ok(src.includes('unitPrice?: number'), 'optional unitPrice on SelectedItem')
    assert.ok(src.includes('name?: string'), 'optional name on SelectedItem')
  })

  it('server-side HIGH-05 protection in update-commande.ts is intact', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    assert.ok(src.includes('persistedItems'), 'persisted-price lookup present')
    assert.ok(src.includes('Number(persisted.unitPrice)'), 'persisted unitPrice authoritative')
    assert.ok(src.includes('commandesUsingEvent'), 'CRIT-02 clone-on-write untouched')
  })
})
