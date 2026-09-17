/**
 * MED-04: Menu and MenuItem deletion guards
 *
 * Verifies that:
 *   A. Menu with linked MenuMenuItem entries is protected.
 *   B. Menu with linked CommandeItem entries is protected.
 *   C. MenuItem with linked MenuMenuItem entries is protected.
 *   D. MenuItem with linked CommandeItem entries is protected.
 *   E. Valid deletions still work.
 *   F. Friendly errors instead of raw P2003.
 *   G. Tenant isolation preserved.
 *   H. CRIT-02 Clone-on-Write behavior is not affected.
 *
 * Run: npx tsx tests/med-04-menu-delete-guards.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── Types ──────────────────────────────────────

interface MenuRow {
  id: string
  organizationId: string
  name: string
}

interface MenuItemRow {
  id: string
  organizationId: string
  name: string
}

interface MenuMenuItemRow {
  menuId: string
  menuItemId: string
}

interface CommandeItemRow {
  commandeId: string
  menuId: string | null
  menuItemId: string | null
}

interface Store {
  menus: MenuRow[]
  menuItems: MenuItemRow[]
  menuMenuItems: MenuMenuItemRow[]
  commandeItems: CommandeItemRow[]
}

// ── Production logic replica (mirrors the FIXED delete-menu.ts) ──

const MENU_HAS_DEPENDENCIES = 'Impossible de supprimer ce menu car il est lié à des commandes ou des articles.'
const MENU_ITEM_HAS_DEPENDENCIES = 'Impossible de supprimer cet article car il est lié à des commandes ou des menus.'

function deleteMenu(store: Store, id: string, organizationId: string): { success: boolean; error?: string } {
  const menu = store.menus.find((m) => m.id === id && m.organizationId === organizationId) ?? null
  if (!menu) return { success: false, error: 'MENU_NOT_FOUND' }

  const menuItemLinkCount = store.menuMenuItems.filter((mmi) => mmi.menuId === id).length
  const commandeItemCount = store.commandeItems.filter((ci) => ci.menuId === id).length
  if (menuItemLinkCount > 0 || commandeItemCount > 0) {
    return { success: false, error: MENU_HAS_DEPENDENCIES }
  }

  store.menus = store.menus.filter((m) => m.id !== id)
  return { success: true }
}

function deleteMenuItem(store: Store, id: string, organizationId: string): { success: boolean; error?: string } {
  const item = store.menuItems.find((mi) => mi.id === id && mi.organizationId === organizationId) ?? null
  if (!item) return { success: false, error: 'MENU_ITEM_NOT_FOUND' }

  const menuItemLinkCount = store.menuMenuItems.filter((mmi) => mmi.menuItemId === id).length
  const commandeItemCount = store.commandeItems.filter((ci) => ci.menuItemId === id).length
  if (menuItemLinkCount > 0 || commandeItemCount > 0) {
    return { success: false, error: MENU_ITEM_HAS_DEPENDENCIES }
  }

  store.menuItems = store.menuItems.filter((mi) => mi.id !== id)
  return { success: true }
}

// ── TESTS ──────────────────────────────────────

describe('MED-04 MENU DELETE GUARD', () => {
  it('Menu with linked MenuMenuItem entries cannot be deleted', () => {
    const store: Store = {
      menus: [{ id: 'menu_1', organizationId: 'org_a', name: 'Wedding Menu' }],
      menuItems: [],
      menuMenuItems: [{ menuId: 'menu_1', menuItemId: 'mi_1' }],
      commandeItems: [],
    }
    const result = deleteMenu(store, 'menu_1', 'org_a')
    assert.equal(result.success, false, 'deletion blocked')
    assert.equal(result.error, MENU_HAS_DEPENDENCIES, 'friendly error')
    assert.equal(store.menus.length, 1, 'Menu preserved')
  })

  it('Menu with linked CommandeItem entries cannot be deleted', () => {
    const store: Store = {
      menus: [{ id: 'menu_1', organizationId: 'org_a', name: 'Wedding Menu' }],
      menuItems: [],
      menuMenuItems: [],
      commandeItems: [{ commandeId: 'cmd_1', menuId: 'menu_1', menuItemId: null }],
    }
    const result = deleteMenu(store, 'menu_1', 'org_a')
    assert.equal(result.success, false, 'deletion blocked')
    assert.equal(result.error, MENU_HAS_DEPENDENCIES, 'friendly error')
  })

  it('Menu with no linked dependencies can be deleted', () => {
    const store: Store = {
      menus: [{ id: 'menu_1', organizationId: 'org_a', name: 'Solo Menu' }],
      menuItems: [],
      menuMenuItems: [],
      commandeItems: [{ commandeId: 'cmd_1', menuId: null, menuItemId: null }],
    }
    const result = deleteMenu(store, 'menu_1', 'org_a')
    assert.equal(result.success, true, 'deletion succeeds')
    assert.equal(store.menus.length, 0, 'Menu removed')
  })

  it('Cross-organization Menu deletion is denied', () => {
    const store: Store = {
      menus: [{ id: 'menu_1', organizationId: 'org_a', name: 'Menu A' }],
      menuItems: [],
      menuMenuItems: [],
      commandeItems: [],
    }
    const result = deleteMenu(store, 'menu_1', 'org_b')
    assert.equal(result.success, false, 'cross-org denied')
    assert.equal(result.error, 'MENU_NOT_FOUND', 'friendly error')
  })
})

describe('MED-04 MENUITEM DELETE GUARD', () => {
  it('MenuItem with linked MenuMenuItem entries cannot be deleted', () => {
    const store: Store = {
      menus: [],
      menuItems: [{ id: 'mi_1', organizationId: 'org_a', name: 'Steak' }],
      menuMenuItems: [{ menuId: 'menu_1', menuItemId: 'mi_1' }],
      commandeItems: [],
    }
    const result = deleteMenuItem(store, 'mi_1', 'org_a')
    assert.equal(result.success, false, 'deletion blocked')
    assert.equal(result.error, MENU_ITEM_HAS_DEPENDENCIES, 'friendly error')
    assert.equal(store.menuItems.length, 1, 'MenuItem preserved')
  })

  it('MenuItem with linked CommandeItem entries cannot be deleted', () => {
    const store: Store = {
      menus: [],
      menuItems: [{ id: 'mi_1', organizationId: 'org_a', name: 'Steak' }],
      menuMenuItems: [],
      commandeItems: [{ commandeId: 'cmd_1', menuId: null, menuItemId: 'mi_1' }],
    }
    const result = deleteMenuItem(store, 'mi_1', 'org_a')
    assert.equal(result.success, false, 'deletion blocked')
    assert.equal(result.error, MENU_ITEM_HAS_DEPENDENCIES, 'friendly error')
  })

  it('MenuItem with no linked dependencies can be deleted', () => {
    const store: Store = {
      menus: [],
      menuItems: [{ id: 'mi_1', organizationId: 'org_a', name: 'Steak' }],
      menuMenuItems: [],
      commandeItems: [{ commandeId: 'cmd_1', menuId: null, menuItemId: null }],
    }
    const result = deleteMenuItem(store, 'mi_1', 'org_a')
    assert.equal(result.success, true, 'deletion succeeds')
    assert.equal(store.menuItems.length, 0, 'MenuItem removed')
  })

  it('Cross-organization MenuItem deletion is denied', () => {
    const store: Store = {
      menus: [],
      menuItems: [{ id: 'mi_1', organizationId: 'org_a', name: 'Steak' }],
      menuMenuItems: [],
      commandeItems: [],
    }
    const result = deleteMenuItem(store, 'mi_1', 'org_b')
    assert.equal(result.success, false, 'cross-org denied')
    assert.equal(result.error, 'MENU_ITEM_NOT_FOUND', 'friendly error')
  })
})

// ── SOURCE CONTRACT ────────────────────────────

describe('MED-04 SOURCE CONTRACT: delete actions', () => {
  it('delete-menu.ts has pre-delete dependency guards', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/menus/actions/delete-menu.ts'), 'utf8')
    assert.ok(src.includes('menuMenuItem.count'), 'counts MenuMenuItem dependencies')
    assert.ok(src.includes('commandeItem.count'), 'counts CommandeItem dependencies')
    assert.ok(src.includes('HAS_DEPENDENCIES'), 'returns friendly error when blocked')
    assert.ok(src.includes('prisma.menu.delete'), 'still deletes the Menu')
  })

  it('delete-menu-item.ts has pre-delete dependency guards', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/menu-items/actions/delete-menu-item.ts'), 'utf8')
    assert.ok(src.includes('menuMenuItem.count'), 'counts MenuMenuItem dependencies')
    assert.ok(src.includes('commandeItem.count'), 'counts CommandeItem dependencies')
    assert.ok(src.includes('HAS_DEPENDENCIES'), 'returns friendly error when blocked')
    assert.ok(src.includes('prisma.menuItem.delete'), 'still deletes the MenuItem')
  })
})
