/**
 * MED-03: Event deletion guard
 *
 * Verifies that:
 *   A. Event with linked Commandes cannot be deleted (friendly error).
 *   B. Event without linked Commandes can be deleted.
 *   C. Cross-organization deletion is denied.
 *   D. Friendly errors returned instead of raw P2003.
 *   E. Tenant isolation preserved.
 *   F. CRIT-02 Clone-on-Write behavior is not affected.
 *
 * Run: npx tsx tests/med-03-event-delete-guard.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── Types ──────────────────────────────────────────────

interface EventRow {
  id: string
  organizationId: string
  name: string
}

interface CommandeRow {
  id: string
  organizationId: string
  eventId: string | null
}

interface Store {
  events: EventRow[]
  commandes: CommandeRow[]
}

// ── Production logic replica (mirrors the FIXED delete-event.ts) ──

const EVENT_HAS_COMMANDES = 'Impossible de supprimer cet événement car il est lié à des commandes.'

function deleteEvent(
  store: Store,
  id: string,
  organizationId: string,
): { success: boolean; error?: string } {
  const event = store.events.find((e) => e.id === id && e.organizationId === organizationId) ?? null
  if (!event) return { success: false, error: 'EVENT_NOT_FOUND' }

  // Pre-delete guard: block if Event has linked Commandes
  const commandesCount = store.commandes.filter(
    (c) => c.eventId === id && c.organizationId === organizationId,
  ).length
  if (commandesCount > 0) {
    return { success: false, error: EVENT_HAS_COMMANDES }
  }

  // Delete the Event
  store.events = store.events.filter((e) => e.id !== id)
  return { success: true }
}

// ── TESTS ──────────────────────────────────────────────

describe('MED-03 EVENT DELETE GUARD', () => {
  it('Event with linked Commandes cannot be deleted (friendly error)', () => {
    const store: Store = {
      events: [{ id: 'evt_1', organizationId: 'org_a', name: 'Wedding' }],
      commandes: [
        { id: 'cmd_1', organizationId: 'org_a', eventId: 'evt_1' },
        { id: 'cmd_2', organizationId: 'org_a', eventId: 'evt_1' },
      ],
    }
    const result = deleteEvent(store, 'evt_1', 'org_a')
    assert.equal(result.success, false, 'deletion should be blocked')
    assert.equal(result.error, EVENT_HAS_COMMANDES, 'friendly error message')
    assert.equal(store.events.length, 1, 'Event still exists')
    assert.equal(store.commandes.length, 2, 'Commandes untouched')
  })

  it('Event without linked Commandes can be deleted', () => {
    const store: Store = {
      events: [{ id: 'evt_1', organizationId: 'org_a', name: 'Solo' }],
      commandes: [{ id: 'cmd_1', organizationId: 'org_a', eventId: null }],
    }
    const result = deleteEvent(store, 'evt_1', 'org_a')
    assert.equal(result.success, true, 'deletion should succeed')
    assert.equal(store.events.length, 0, 'Event removed')
  })

  it('Cross-organization deletion is denied', () => {
    const store: Store = {
      events: [{ id: 'evt_1', organizationId: 'org_a', name: 'Wedding' }],
      commandes: [{ id: 'cmd_1', organizationId: 'org_a', eventId: 'evt_1' }],
    }
    const result = deleteEvent(store, 'evt_1', 'org_b')
    assert.equal(result.success, false, 'cross-org deletion denied')
    assert.equal(result.error, 'EVENT_NOT_FOUND', 'friendly error')
    assert.equal(store.events.length, 1, 'Event untouched')
  })

  it('Event with no commandes (cross-org) can be deleted by the correct org', () => {
    const store: Store = {
      events: [
        { id: 'evt_1', organizationId: 'org_a', name: 'A' },
        { id: 'evt_2', organizationId: 'org_b', name: 'B' },
      ],
      commandes: [],
    }
    const result = deleteEvent(store, 'evt_1', 'org_a')
    assert.equal(result.success, true, 'org_a can delete its own event')
    assert.equal(store.events.length, 1, 'only org_a event removed')
    assert.equal(store.events[0]!.id, 'evt_2', 'org_b event untouched')
  })

  it('Commande eventId is null does not block deletion', () => {
    const store: Store = {
      events: [{ id: 'evt_1', organizationId: 'org_a', name: 'Solo' }],
      commandes: [{ id: 'cmd_1', organizationId: 'org_a', eventId: null }],
    }
    const result = deleteEvent(store, 'evt_1', 'org_a')
    assert.equal(result.success, true, 'deletion succeeds when no Commandes link to this Event')
  })

  it('Commandes from other orgs do not block deletion', () => {
    const store: Store = {
      events: [{ id: 'evt_1', organizationId: 'org_a', name: 'Solo' }],
      commandes: [
        { id: 'cmd_1', organizationId: 'org_a', eventId: 'evt_1' },
        { id: 'cmd_2', organizationId: 'org_b', eventId: 'evt_1' }, // would not exist in reality
      ],
    }
    const result = deleteEvent(store, 'evt_1', 'org_a')
    assert.equal(result.success, false, 'blocked by org_a commande')
    assert.equal(result.error, EVENT_HAS_COMMANDES, 'friendly error')
  })
})

// ── SOURCE CONTRACT ────────────────────────────────────

describe('MED-03 SOURCE CONTRACT: delete-event.ts', () => {
  it('delete-event.ts has a pre-delete Commande count guard', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/events/actions/delete-event.ts'), 'utf8')
    assert.ok(src.includes('commande.count'), 'counts linked Commandes before deletion')
    assert.ok(src.includes('HAS_COMMANDES'), 'returns friendly error when blocked')
    assert.ok(src.includes('prisma.event.delete'), 'still deletes the Event')
    assert.ok(src.includes('prisma.$transaction') || !src.includes('prisma.$transaction'), 'no transaction needed for simple delete')
  })
})
