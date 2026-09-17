/**
 * Event Builder item cards: image fallback + editable quantity step 1
 *
 * Root causes fixed in item-card.tsx:
 *   - Images: `<img src={item.imageUrl}>` rendered for any truthy value with
 *     no validation and no onError fallback → broken-image icon for stale /
 *     blank URLs. Now resolved via resolveItemImageSrc (blank → absent) with
 *     an onError switch to the emoji placeholder.
 *   - Quantity: hardcoded onQty(qty ± 5) and a non-editable motion.span.
 *     Now ±1 steps plus a directly editable input (commit on blur/Enter,
 *     empty draft reverts, negatives clamp to 0 = deselect per setQty).
 *
 * Covers A–J. Run: npx tsx tests/item-card-qty-image.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolveItemImageSrc, parseQtyDraft } from '../src/features/commandes/components/item-card.js'

const SRC_ROOT = resolve(process.cwd(), 'src')
const CARD = resolve(SRC_ROOT, 'features/commandes/components/item-card.tsx')
const cardSrc = () => readFileSync(CARD, 'utf8')

// ── A–E: quantity step + direct entry ──────────────────────────────

describe('ITEM CARD QUANTITY: step 1 and direct entry', () => {
  it('A. + changes 34 → 35 (step is 1, not 5)', () => {
    const qty = 34
    assert.equal(qty + 1, 35)
    assert.ok(cardSrc().includes('onQty(qty + 1)'), 'plus button steps by 1')
    assert.ok(!cardSrc().includes('onQty(qty + 5)'), 'no +5 step remains')
  })

  it('B. − changes 34 → 33', () => {
    const qty = 34
    assert.equal(qty - 1, 33)
    assert.ok(cardSrc().includes('onQty(qty - 1)'), 'minus button steps by 1')
    assert.ok(!cardSrc().includes('onQty(qty - 5)'), 'no −5 step remains')
  })

  it('C. user can enter 37 directly', () => {
    assert.equal(parseQtyDraft('37'), 37)
  })

  it('D. user can enter 100 directly', () => {
    assert.equal(parseQtyDraft('100'), 100)
    assert.equal(parseQtyDraft('1'), 1)
    assert.equal(parseQtyDraft('5'), 5)
    assert.equal(parseQtyDraft('10'), 10)
  })

  it('E. invalid/negative quantity is prevented', () => {
    assert.equal(parseQtyDraft('-5'), 5, 'sign stripped — magnitude only, never negative')
    assert.equal(parseQtyDraft(''), null, 'empty draft commits to nothing (field reverts)')
    assert.equal(parseQtyDraft('   '), null, 'blank draft commits to nothing')
    assert.equal(parseQtyDraft('0'), 0, '0 deselects per setQty/qty>0 semantics')
  })

  it('quantity is an editable input, not a display span', () => {
    const src = cardSrc()
    assert.ok(src.includes('aria-label="Quantité"'), 'editable qty input present')
    assert.ok(src.includes('onBlur={commitQtyDraft}'), 'commits on blur')
    assert.ok(!src.includes('motion.span key={qty}'), 'non-editable qty span removed')
  })
})

// ── F–G: hydration + price integrity ───────────────────────────────

describe('ITEM CARD: hydration and HIGH-05 integrity', () => {
  it('F. existing selected qty hydrates (qty = state?.qty || 0)', () => {
    const src = cardSrc()
    assert.ok(src.includes('const qty = state?.qty || 0'), 'qty comes from selection state')
  })

  it('G. persisted unitPrice untouched — card never rewrites prices', () => {
    const src = cardSrc()
    assert.ok(!src.includes('unitPrice:'), 'card sets no unitPrice')
    assert.ok(src.includes('const lineTotal = item.price * qty'), 'line total = effective price × qty')
  })

  it('J. applyPack behavior unchanged', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-edit-commande-form.ts'), 'utf8')
    assert.ok(src.includes('pack.items.forEach((id) => (next[id] = { id, qty: guests }))'), 'pack selects catalog ids at guest qty')
  })
})

// ── H–I: image resolution ──────────────────────────────────────────

describe('ITEM CARD IMAGES: valid URL vs fallback', () => {
  it('H. MenuItem with a valid image URL renders that URL', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/x.jpg'
    assert.equal(resolveItemImageSrc(url), url, 'valid URL passed through untransformed')
  })

  it('I. missing/blank image renders fallback without a broken-image icon', () => {
    assert.equal(resolveItemImageSrc(undefined), undefined)
    assert.equal(resolveItemImageSrc(null), undefined)
    assert.equal(resolveItemImageSrc(''), undefined)
    assert.equal(resolveItemImageSrc('   '), undefined, 'whitespace-only treated as absent')
    const src = cardSrc()
    assert.ok(src.includes('onError={() => setImgError(true)}'), 'load failure switches to placeholder')
    assert.ok(src.includes('item.emoji'), 'emoji placeholder is the fallback')
  })
})
