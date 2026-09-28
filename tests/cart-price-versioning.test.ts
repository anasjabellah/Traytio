/**
 * Cart price versioning — a cart line preserves the unit price active when
 * its quantity was added; catalog price changes never reprice history.
 *
 * Covers (against the real lib/cart-lines.ts, no replicas for behavior):
 *   1. same product + same price → quantities merge;
 *   2. same product + different price → a new independent line;
 *   3. old line keeps its price after a catalog change;
 *   4. totals across price versions (31×70 + 10×80 = 2970);
 *   plus aggregate spill, toggle, notes, hydration, removal, and source
 *   contracts pinning the fix into both wizard hooks.
 *
 * Run: npx tsx tests/cart-price-versioning.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  lineKeyFor,
  productQty,
  productNote,
  productTotal,
  hasMultiplePrices,
  displayPriceFor,
  setProductQty,
  clearProduct,
  setProductNote,
  hydrateLines,
} from '../src/features/commandes/lib/cart-lines.js'
import type { SelectedItem } from '../src/features/commandes/data/mock-data.js'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

type Cart = Record<string, SelectedItem>
const ID = 'mi_bastila'

// The reported scenario: 31 × 70 MAD, then the catalog moves to 80 MAD.
function cartWith31At70(): Cart {
  return setProductQty({}, ID, 31, 70)
}

describe('CART VERSIONING BEHAVIOR: merge vs split', () => {
  it('same product + same price → quantity is merged into one line', () => {
    let cart = cartWith31At70()
    cart = setProductQty(cart, ID, 41, 70)
    const keys = Object.keys(cart)
    assert.equal(keys.length, 1, 'still a single line')
    assert.equal(cart[keys[0]].qty, 41)
    assert.equal(cart[keys[0]].unitPrice, 70)
  })

  it('same product + different price → a new independent line', () => {
    let cart = cartWith31At70()
    cart = setProductQty(cart, ID, 41, 80)
    const keys = Object.keys(cart)
    assert.equal(keys.length, 2, 'two independent lines')
    assert.deepEqual(
      keys.map((k) => ({ qty: cart[k].qty, price: cart[k].unitPrice })),
      [
        { qty: 31, price: 70 },
        { qty: 10, price: 80 },
      ],
    )
  })

  it('line keys encode product and price', () => {
    assert.equal(lineKeyFor(ID, 70), `${ID}::70`)
    assert.notEqual(lineKeyFor(ID, 70), lineKeyFor(ID, 80))
    assert.equal(lineKeyFor(ID, undefined), ID, 'priceless entries keep the legacy key')
  })
})

describe('CART VERSIONING BEHAVIOR: history is never repriced', () => {
  it('old line keeps 70 after the catalog moves (totals use stored prices)', () => {
    const cart = setProductQty(cartWith31At70(), ID, 41, 80)
    // Simulate the catalog moving again — stored lines do not follow it.
    assert.equal(productTotal(cart, ID, 999), 31 * 70 + 10 * 80)
    assert.equal(productQty(cart, ID), 41)
  })

  it('totals are correct for multiple price versions: 31×70 + 10×80 = 2970', () => {
    const cart = setProductQty(cartWith31At70(), ID, 41, 80)
    const lines = Object.values(cart)
    const subtotal = lines.reduce((s, l) => s + l.qty * (l.unitPrice ?? 0), 0)
    assert.equal(subtotal, 2970)
  })

  it('decreasing quantity spills newest-first and never touches older prices', () => {
    let cart = setProductQty(cartWith31At70(), ID, 41, 80)
    cart = setProductQty(cart, ID, 35, 80)
    const lines = Object.values(cart)
    assert.deepEqual(
      lines.map((l) => ({ qty: l.qty, price: l.unitPrice })),
      [
        { qty: 31, price: 70 },
        { qty: 4, price: 80 },
      ],
    )
  })

  it('clearing a product zeroes every version but keeps the lines', () => {
    let cart = setProductQty(cartWith31At70(), ID, 41, 80)
    cart = clearProduct(cart, ID)
    assert.equal(productQty(cart, ID), 0)
    assert.equal(Object.keys(cart).length, 2, 'entries preserved for notes/prices')
    assert.deepEqual(
      Object.values(cart).map((l) => l.unitPrice),
      [70, 80],
    )
  })

  it('notes follow the newest line and survive price changes', () => {
    let cart = cartWith31At70()
    cart = setProductNote(cart, ID, 'Sans amandes')
    cart = setProductQty(cart, ID, 41, 80)
    assert.equal(productNote(cart, ID), 'Sans amandes')
    assert.equal(cart[`${ID}::70`].note, 'Sans amandes', 'original note untouched')
  })

  it('hydration keeps two persisted rows at different prices as two lines', () => {
    const cart = hydrateLines([
      { id: ID, qty: 31, unitPrice: 70, name: 'bastila djaj' },
      { id: ID, qty: 10, unitPrice: 80, name: 'bastila djaj' },
    ])
    assert.equal(Object.keys(cart).length, 2, 'refresh preserves both lines')
    assert.equal(productTotal(cart, ID), 2970)
  })

  it('removal to zero keeps the line out of totals (qty>0 filter downstream)', () => {
    let cart = cartWith31At70()
    cart = setProductQty(cart, ID, 0, 70)
    const live = Object.values(cart).filter((l) => l.qty > 0)
    assert.equal(live.length, 0)
    assert.equal(productTotal(cart, ID), 0)
  })
})

describe('CART DISPLAY: multi-price neutral rendering', () => {
  it('single price version → no neutral label (existing behavior)', () => {
    assert.equal(hasMultiplePrices(cartWith31At70(), ID), false)
    assert.equal(hasMultiplePrices(setProductQty(cartWith31At70(), ID, 41, 70), ID), false)
  })

  it('31×70 + 10×80 → multi-price display, aggregate qty preserved', () => {
    const cart = setProductQty(cartWith31At70(), ID, 41, 80)
    assert.equal(hasMultiplePrices(cart, ID), true)
    assert.equal(productQty(cart, ID), 41, 'card still shows total quantity 41')
    assert.equal(productTotal(cart, ID), 2970, 'truth stays per-line in calculations')
  })

  it('zero-qty and priceless lines do not trigger the label', () => {
    assert.equal(hasMultiplePrices(clearProduct(cartWith31At70(), ID), ID), false)
    assert.equal(hasMultiplePrices({ [ID]: { id: ID, qty: 2 } }, ID), false)
  })

  it('builder passes the flag; card renders neutral text without touching pricing', () => {
    const builder = read('src/features/commandes/components/builder-step.tsx')
    assert.ok(builder.includes('displayPriceFor(selected, item.id, item.price)'), 'display computed per product')
    assert.ok(builder.includes('multiPrice={display.multi}'), 'flag passed to card from the same source')
    const card = read('src/features/commandes/components/item-card.tsx')
    assert.ok(card.includes('multiPrice?: boolean'), 'optional flag, handlers unchanged')
    assert.ok(card.includes('Plusieurs tarifs'), 'neutral label rendered')
    assert.ok(card.includes('const lineTotal = item.price * qty'), 'line-total formula untouched')
    assert.ok(card.includes('const qty = state?.qty || 0'), 'qty source untouched')
    assert.ok(!card.includes('unitPrice:'), 'card still sets no unitPrice')
    assert.ok(card.includes('onQty(qty + 1)') && card.includes('onQty(qty - 1)'), 'steppers unchanged')
  })

  it('summary stays the authoritative per-line breakdown', () => {
    const summary = read('src/features/commandes/components/summmary-panel.tsx')
    assert.ok(summary.includes('key={s.key}'), 'one row per price version')
    assert.ok(summary.includes('MAD/u'), 'unit price per row')
  })
})

describe('CART DISPLAY: stored-price card (bastila hoot cases)', () => {
  const HOOT = 'mi_hoot';

  it('A. no cart line → card displays catalog price 179', () => {
    assert.deepEqual(displayPriceFor({}, HOOT, 179), { price: 179, multi: false })
  })

  it('B. stored 46×100, catalog 179 → card displays 100 and 46×100', () => {
    const cart = setProductQty({}, HOOT, 46, 100)
    const display = displayPriceFor(cart, HOOT, 179)
    assert.deepEqual(display, { price: 100, multi: false })
    assert.equal(productQty(cart, HOOT), 46)
    assert.equal(display.price * productQty(cart, HOOT), 4600, 'card math, not 46×179=8234')
  })

  it('C. 31×70 + 10×80 → neutral label, never live-price math', () => {
    const cart = setProductQty(setProductQty({}, HOOT, 31, 70), HOOT, 41, 80)
    const display = displayPriceFor(cart, HOOT, 80)
    assert.equal(display.multi, true)
    assert.equal(productTotal(cart, HOOT), 2970)
  })

  it('D. catalog moves 179→250 → stored single-price line still displays 100', () => {
    const cart = setProductQty({}, HOOT, 46, 100)
    assert.deepEqual(displayPriceFor(cart, HOOT, 250), { price: 100, multi: false })
  })

  it('builder feeds the stored price into the card (source contract)', () => {
    const builder = read('src/features/commandes/components/builder-step.tsx')
    assert.ok(builder.includes('displayPriceFor(selected, item.id, item.price)'), 'display derived per product')
    assert.ok(builder.includes('item={{ ...item, price: display.price }}'), 'card receives stored price')
    assert.ok(builder.includes('multiPrice={display.multi}'), 'neutral flag from the same source')
  })
})

describe('CART VERSIONING SOURCE CONTRACT: hooks carry stored prices', () => {
  it('create hook resolves lines from stored unitPrice, not live lookup', () => {
    const src = read('src/features/commandes/hooks/use-commande-form.ts')
    assert.ok(src.includes('lib/cart-lines'), 'create hook uses the cart-lines lib')
    assert.ok(src.includes('setProductQty(s, id, qty, catalogPriceOf(id))'), 'qty writes snapshot the catalog price')
    assert.ok(src.includes('productQty(selected, id)'), 'toggle reads aggregate quantity')
    assert.ok(src.includes('unitPrice: price'), 'pack lines snapshot the catalog price')
  })

  it('create hook submit persists per-line stored prices', () => {
    const src = read('src/features/commandes/hooks/use-commande-form.ts')
    assert.ok(src.includes('unitPrice: s.item.price'), 'submit sends the resolved (stored) price')
    assert.ok(src.includes('totalPrice: s.item.price * s.qty'), 'line totals use the stored price')
  })

  it('edit hook hydrates line-keyed entries and keeps HIGH-05 expressions', () => {
    const src = read('src/features/commandes/hooks/use-edit-commande-form.ts')
    assert.ok(src.includes('hydrateLines('), 'hydration builds price-versioned lines')
    assert.ok(src.includes('unitPrice: Number(item.unitPrice)'), 'persisted price carried (HIGH-05)')
    assert.ok(src.includes('s.unitPrice ?? item?.price'), 'persisted-first price resolution (HIGH-05)')
    assert.ok(src.includes('pack.items.forEach((id) => (next[id] = { id, qty: guests }))'), 'pack shape unchanged')
  })

  it('builder aggregates by product; summary renders per-line keys and unit prices', () => {
    const builder = read('src/features/commandes/components/builder-step.tsx')
    assert.ok(builder.includes('productQty(selected, i.id)'), 'category counts aggregate versions')
    assert.ok(builder.includes('productQty(selected, item.id)'), 'card binds aggregate quantity')
    const summary = read('src/features/commandes/components/summmary-panel.tsx')
    assert.ok(summary.includes('key={s.key}'), 'no duplicate React keys across versions')
    assert.ok(summary.includes('MAD/u'), 'per-line unit price displayed')
  })

  it('item-card pricing contract untouched (pins hold)', () => {
    const src = read('src/features/commandes/components/item-card.tsx')
    assert.ok(src.includes('const qty = state?.qty || 0'), 'qty still from selection state')
    assert.ok(src.includes('const lineTotal = item.price * qty'), 'line total formula untouched')
    assert.ok(!src.includes('unitPrice:'), 'card still sets no unitPrice')
  })

  it('server-side price protection untouched', () => {
    const create = read('src/features/commandes/actions/create-commande.ts')
    assert.ok(create.includes('catalogPrices'), 'create still guards client prices')
    const update = read('src/features/commandes/actions/update-commande.ts')
    assert.ok(update.includes('Number(persisted.unitPrice)'), 'update still prefers persisted prices')
  })
})
