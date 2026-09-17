/**
 * HIGH-05: Item price fallback from persisted rows
 *
 * Root cause: `use-edit-commande-form.ts` rebuilds line items from the
 * CURRENT catalog (`s.item.price`) and `update-commande.ts` replaced all
 * items (`deleteMany` + `create`) with whatever the client sent. A later
 * MenuItem price change therefore rewrote the historical price of existing
 * Commandes on the next edit/save.
 *
 * Fix (server-side, single layer — covers every consumer):
 *   - update-commande.ts fetches persisted CommandeItems before the tx and,
 *     for rows that already exist (matched by menuItemId, falling back to
 *     name for custom items), keeps the persisted unitPrice and recomputes
 *     totalPrice = unitPrice × new quantity (same formula as the client).
 *   - Only genuinely new rows use the client/catalog price.
 *   - Defensive org-scoped catalog fallback fires only when an incoming
 *     item references a menuItemId but carries no valid unitPrice (the zod
 *     schema requires one, so this is a safety net, not the happy path).
 *   - Invoice/PDF paths already read persisted CommandeItem prices — locked
 *     in by source-contract tests below, unchanged.
 *
 * Run: npx tsx tests/high-05-item-price-fallback.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── Types ──────────────────────────────────────────────────────────

interface PersistedItem {
  menuItemId: string | null
  name: string
  unitPrice: number
}

interface IncomingItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  menuItemId?: string | null
  notes?: string | null
}

interface ResolvedItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  menuItemId?: string
  notes?: string
}

// ── Production logic replica (mirrors update-commande.ts) ─────────

function resolveUpdateItems(
  persistedItems: PersistedItem[],
  incoming: IncomingItem[],
  catalogPrices: Map<string, number>,
): ResolvedItem[] {
  return incoming.map((item) => {
    const persisted = persistedItems.find((p) =>
      item.menuItemId
        ? p.menuItemId === item.menuItemId
        : p.menuItemId == null && p.name === item.name,
    )
    const hasClientPrice =
      typeof item.unitPrice === 'number' &&
      Number.isFinite(item.unitPrice) &&
      item.unitPrice >= 0
    const unitPrice = persisted
      ? Number(persisted.unitPrice)
      : hasClientPrice
        ? item.unitPrice
        : (item.menuItemId ? catalogPrices.get(item.menuItemId) : undefined)
          ?? item.unitPrice
    return {
      name: item.name,
      quantity: item.quantity,
      unitPrice,
      totalPrice: persisted ? unitPrice * item.quantity : item.totalPrice,
      menuItemId: item.menuItemId ?? undefined,
      notes: item.notes ?? undefined,
    }
  })
}

// ── 1. Persisted price wins ────────────────────────────────────────

describe('HIGH-05 BEHAVIOR: persisted price is authoritative', () => {
  it('existing item keeps its persisted unitPrice when the catalog price changes', () => {
    const persisted: PersistedItem[] = [{ menuItemId: 'mi_1', name: 'Steak', unitPrice: 100 }]
    const incoming: IncomingItem[] = [{ name: 'Steak', quantity: 2, unitPrice: 150, totalPrice: 300, menuItemId: 'mi_1' }]
    const out = resolveUpdateItems(persisted, incoming, new Map())
    assert.equal(out[0]!.unitPrice, 100, 'historical price preserved, catalog change ignored')
  })

  it('totalPrice is recomputed from the new quantity with the persisted unitPrice', () => {
    const persisted: PersistedItem[] = [{ menuItemId: 'mi_1', name: 'Steak', unitPrice: 100 }]
    const incoming: IncomingItem[] = [{ name: 'Steak', quantity: 5, unitPrice: 150, totalPrice: 750, menuItemId: 'mi_1' }]
    const out = resolveUpdateItems(persisted, incoming, new Map())
    assert.equal(out[0]!.unitPrice, 100)
    assert.equal(out[0]!.totalPrice, 500, '100 × 5 with the same quantity × unitPrice formula')
  })

  it('custom item (no menuItemId) is matched by name and keeps its price', () => {
    const persisted: PersistedItem[] = [{ menuItemId: null, name: 'Service traiteur', unitPrice: 2000 }]
    const incoming: IncomingItem[] = [{ name: 'Service traiteur', quantity: 1, unitPrice: 2500, totalPrice: 2500, menuItemId: null }]
    const out = resolveUpdateItems(persisted, incoming, new Map())
    assert.equal(out[0]!.unitPrice, 2000, 'custom item history preserved')
  })

  it('new item with no persisted row uses the client/catalog price', () => {
    const persisted: PersistedItem[] = [{ menuItemId: 'mi_1', name: 'Steak', unitPrice: 100 }]
    const incoming: IncomingItem[] = [{ name: 'Salade', quantity: 3, unitPrice: 40, totalPrice: 120, menuItemId: 'mi_2' }]
    const out = resolveUpdateItems(persisted, incoming, new Map())
    assert.equal(out[0]!.unitPrice, 40, 'new item takes the current catalog price')
    assert.equal(out[0]!.totalPrice, 120, 'caller-supplied total kept for new rows')
  })

  it('catalog fallback fires only when the incoming price is genuinely absent', () => {
    const persisted: PersistedItem[] = []
    const incoming = [{ name: 'Steak', quantity: 2, unitPrice: NaN, totalPrice: NaN, menuItemId: 'mi_1' }]
    const out = resolveUpdateItems(persisted, incoming, new Map([['mi_1', 120]]))
    assert.equal(out[0]!.unitPrice, 120, 'org-scoped catalog price used as fallback')
  })

  it('a renamed menuItemId is treated as a new row (no stale match)', () => {
    const persisted: PersistedItem[] = [{ menuItemId: 'mi_1', name: 'Steak', unitPrice: 100 }]
    const incoming: IncomingItem[] = [{ name: 'Steak premium', quantity: 1, unitPrice: 180, totalPrice: 180, menuItemId: 'mi_9' }]
    const out = resolveUpdateItems(persisted, incoming, new Map())
    assert.equal(out[0]!.unitPrice, 180, 'different identity → current price')
  })
})

// ── 2. Source contract ─────────────────────────────────────────────

describe('HIGH-05 SOURCE CONTRACT', () => {
  it('update-commande.ts preserves persisted prices and recomputes totals', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    assert.ok(src.includes('persistedItems'), 'fetches persisted items before the tx')
    assert.ok(src.includes('commandeItem.findMany'), 'reads existing CommandeItem rows')
    assert.ok(src.includes('Number(persisted.unitPrice)'), 'persisted unitPrice is authoritative')
    assert.ok(src.includes('unitPrice * item.quantity'), 'total recomputed from new quantity')
    assert.ok(src.includes('catalogPrices'), 'defensive catalog fallback exists')
    assert.ok(src.includes('organizationId'), 'catalog fallback stays org-scoped')
  })

  it('create-commande.ts keeps client totals on the happy path with a guarded fallback', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/create-commande.ts'), 'utf8')
    assert.ok(src.includes('hasClientPrice'), 'distinguishes valid vs absent prices')
    assert.ok(src.includes('catalogPrices'), 'catalog fallback for genuinely-missing prices')
    assert.ok(src.includes('organizationId'), 'fallback lookup is org-scoped')
  })

  it('invoice detail mapping reads persisted CommandeItem prices (unchanged)', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/invoices/actions/invoice-actions.ts'), 'utf8')
    assert.ok(src.includes('unitPrice: Number(item.unitPrice)'), 'invoice uses persisted unitPrice')
    assert.ok(src.includes('totalPrice: Number(item.totalPrice)'), 'invoice uses persisted totalPrice')
    assert.ok(!src.includes('menuItem.unitPrice'), 'invoice never re-reads the live catalog price')
  })

  it('menuItem ownership validation stays org-scoped', () => {
    const createSrc = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/create-commande.ts'), 'utf8')
    const updateSrc = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    assert.ok(createSrc.includes('where: { id: { in: menuItemIds }, organizationId }'), 'create validates tenant scope')
    assert.ok(updateSrc.includes('where: { id: { in: menuItemIds }, organizationId }'), 'update validates tenant scope')
  })
})
