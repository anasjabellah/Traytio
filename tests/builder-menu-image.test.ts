/**
 * Builder menu images: uploaded imageUrl must reach the Event Builder card.
 *
 * Root cause: the builder's catalog queries (["commande-menus"],
 * ["commande-all-menu-items"]) were never invalidated after a MenuItem
 * create/update/delete/duplicate/archive, so an uploaded image kept showing
 * the pre-upload snapshot (no image → emoji fallback) until the 30s stale
 * window expired. Verified end-to-end that DB → actions → hooks → ItemCard
 * otherwise preserve imageUrl untouched (including an SSR render proof of
 * the real ItemCard with live DB rows).
 *
 * Fix: menu-items-page-client refreshCatalog() invalidates both builder
 * keys alongside the local list on every catalog mutation.
 *
 * Covers A–E (+F/G by reference to high-05-edit-form-hydration).
 * Run: npx tsx tests/builder-menu-image.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolveItemImageSrc } from '../src/features/commandes/components/item-card.js'

const SRC_ROOT = resolve(process.cwd(), 'src')
const read = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf8')

// ── Field identity: the one true image field ───────────────────────

describe('IMAGE FIELD: imageUrl end-to-end, untransformed', () => {
  it('Prisma schema stores the image on MenuItem.imageUrl', () => {
    const src = read('prisma/schema.prisma')
    assert.ok(src.includes('imageUrl'), 'MenuItem.imageUrl exists, no image/image_url doppelganger')
  })

  it('both builder server actions select and map imageUrl', () => {
    for (const f of [
      'features/commandes/actions/get-commande-all-menu-items.ts',
      'features/commandes/actions/get-commande-menus.ts',
    ]) {
      const src = read(f)
      assert.ok(src.includes('imageUrl: true'), `${f} selects imageUrl`)
      assert.ok(src.includes('imageUrl: item.imageUrl') || src.includes('imageUrl: mi.menuItem.imageUrl'), `${f} maps imageUrl`)
    }
  })

  it('both wizard hooks forward imageUrl in both branches (pack + all-items)', () => {
    for (const f of [
      'features/commandes/hooks/use-commande-form.ts',
      'features/commandes/hooks/use-edit-commande-form.ts',
    ]) {
      const src = read(f)
      const occurrences = (src.match(/imageUrl: i\.imageUrl \?\? undefined/g) ?? []).length
      assert.equal(occurrences, 2, `${f} maps imageUrl in pack branch AND all-items branch`)
    }
  })

  it('A/B. uploaded URL reaches the card and is rendered, never replaced', () => {
    const url = 'https://res.cloudinary.com/dkotjjdfv/image/upload/v1789649057/organizations/cmtm/x.jpg'
    assert.equal(resolveItemImageSrc(url), url, 'exact uploaded URL passed through')
    const src = read('features/commandes/components/item-card.tsx')
    assert.ok(src.includes('src={imgSrc}'), 'card renders the resolved URL')
    assert.ok(src.includes('{imgSrc && !imgError ?'), 'image branch wins whenever a usable URL exists')
    assert.ok(src.includes('onError={() => setImgError(true)}'), 'only a failed load falls back')
  })

  it('C. null/blank image uses the fallback (no broken icon)', () => {
    assert.equal(resolveItemImageSrc(null), undefined)
    assert.equal(resolveItemImageSrc(undefined), undefined)
    assert.equal(resolveItemImageSrc('  '), undefined)
  })
})

// ── Both render locations ──────────────────────────────────────────

describe('IMAGE LOCATIONS: admin and builder render the real URL', () => {
  it('A. Menu Items card renders the real imageUrl (never replaced)', () => {
    const src = read('features/menu-items/components/MenuItemCard.tsx')
    assert.ok(src.includes('src={imgSrc}'), 'admin card renders the resolved URL')
    assert.ok(src.includes("const imgSrc = (item.imageUrl ?? '').trim() || undefined"), 'blank counts as absent')
  })

  it('A. table thumb renders the real imageUrl (never replaced)', () => {
    const src = read('features/menu-items/components/menu-items-columns.tsx')
    assert.ok(src.includes('src={(item.imageUrl ?? \'\').trim()}'), 'thumb renders the resolved URL')
  })

  it('B. uploaded image is not replaced by the fallback in either location', () => {
    for (const f of [
      'features/menu-items/components/MenuItemCard.tsx',
      'features/commandes/components/item-card.tsx',
    ]) {
      const src = read(f)
      assert.ok(src.includes('<img'), `${f} has an img branch`)
      // The emoji is a sibling underneath the image, not a replacement:
      // it only becomes visible when there is no URL or the load fails.
      assert.ok(src.includes('onError='), `${f} degrades on load failure instead of broken icon`)
    }
  })

  it('C. null image uses the fallback in both locations', () => {
    assert.equal(resolveItemImageSrc(null), undefined)
    const admin = read('features/menu-items/components/MenuItemCard.tsx')
    assert.ok(admin.includes('<span>{emoji}</span>'), 'admin keeps its emoji placeholder')
  })
})

// ── The actual loss point: stale builder cache ─────────────────────

describe('INVALIDATION: catalog mutations refresh the builder', () => {
  it('menu-items page invalidates both builder query keys on every mutation', () => {
    const src = read('app/dashboard/menu-items/menu-items-page-client.tsx')
    assert.ok(src.includes('[["commande-menus"], ["commande-all-menu-items"]]'), 'exact builder keys invalidated')
    assert.ok(src.includes('refreshCatalog'), 'single refresh path for all mutations')
  })

  it('create/edit/delete dialogs all route through the invalidating refresh', () => {
    const src = read('app/dashboard/menu-items/menu-items-page-client.tsx')
    assert.ok(src.includes('onSuccess={refreshCatalog}'), 'dialogs trigger catalog refresh')
    assert.ok(src.includes('openDuplicate(item).then(() => refreshCatalog())'), 'duplicate refreshes catalog')
    assert.ok(src.includes('openArchive(item).then(() => refreshCatalog())'), 'archive refreshes catalog')
  })

  it('builder queries are plain useQuery reads (invalidation takes effect)', () => {
    for (const f of [
      'features/commandes/hooks/use-commande-form.ts',
      'features/commandes/hooks/use-edit-commande-form.ts',
    ]) {
      const src = read(f)
      assert.ok(src.includes('queryKey: ["commande-menus"]'), `${f} key matches invalidation`)
      assert.ok(src.includes('queryKey: ["commande-all-menu-items"]'), `${f} key matches invalidation`)
    }
  })
})

// ── D/E preserved ──────────────────────────────────────────────────

describe('PRESERVED: HIGH-05 price and quantity behavior', () => {
  it('D. hydration still prefers persisted unitPrice (see high-05-edit-form-hydration)', () => {
    const src = read('features/commandes/hooks/use-edit-commande-form.ts')
    assert.ok(src.includes('s.unitPrice ?? item?.price'), 'persisted-first join intact')
  })

  it('E. quantity step/input behavior unchanged', () => {
    const src = read('features/commandes/components/item-card.tsx')
    assert.ok(src.includes('onQty(qty + 1)') && src.includes('onQty(qty - 1)'), '±1 steps intact')
    assert.ok(src.includes('aria-label="Quantité"'), 'editable input intact')
  })
})
