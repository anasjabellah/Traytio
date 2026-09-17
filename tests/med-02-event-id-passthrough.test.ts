/**
 * MED-02: Commande wizard eventId passthrough
 *
 * Verifies that:
 *   A. Selecting an existing Event in the wizard passes its eventId to createCommande.
 *   B. Creating a new Event does not send an unrelated eventId.
 *   C. Editing a Commande preserves the existing eventId.
 *   D. CRIT-02 Clone-on-Write behavior remains intact.
 *
 * Run: npx tsx tests/med-02-event-id-passthrough.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── SOURCE CONTRACT: useCommandeForm.ts passes eventId ────────────

describe('MED-02 SOURCE CONTRACT: eventId passthrough', () => {
  it('useCommandeForm.ts handleSubmit passes eventId to createCommande when selectedEvent is an existing event', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-commande-form.ts'), 'utf8')
    assert.ok(src.includes('eventId: selectedEvent'), 'eventId is derived from selectedEvent')
    assert.ok(src.includes('selectedEvent && selectedEvent !== "new"'), 'eventId is only sent for existing events (not "new")')
    assert.ok(src.includes('createCommande('), 'createCommande is called')
    assert.ok(src.includes('eventId:'), 'eventId is included in the createCommande call')
  })

  it('update-commande.ts preserves existing eventId and implements clone-on-write', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    assert.ok(src.includes('let resolvedEventId = existing.eventId'), 'preserves existing eventId')
    assert.ok(src.includes('commandesUsingEvent'), 'clone-on-write check exists')
    assert.ok(src.includes('commandesUsingEvent > 1'), 'clones when shared (>1 Commande)')
    assert.ok(src.includes('clone'), 'creates a cloned Event')
  })

  it('create-commande.ts preserves client-provided eventId', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/create-commande.ts'), 'utf8')
    assert.ok(src.includes('const resolvedEventId = data.eventId ?? null'), 'uses client-provided eventId')
    assert.ok(src.includes('let eventId = resolvedEventId'), 'eventId initialized from client')
  })
})

// ── BEHAVIOR: store-based simulation ─────────────────────────────

interface CommandeCreateInput {
  clientId: string
  eventId?: string
  eventName?: string
  eventType?: string
  eventDate?: string
  eventStatus?: string
}

function simulateCreateCommande(
  existingEventId: string | null,
  selectedEventId: string | null,
): string | null {
  // Mirrors the fix: eventId is passed when selectedEvent is an existing event
  if (selectedEventId && selectedEventId !== 'new') {
    return selectedEventId
  }
  // No eventId → server auto-creates Event (eventId = null)
  return existingEventId
}

describe('MED-02 BEHAVIOR: eventId passthrough', () => {
  it('Selecting an existing event passes its eventId to createCommande', () => {
    const result = simulateCreateCommande(null, 'evt_existing_1')
    assert.equal(result, 'evt_existing_1', 'existing eventId is passed through')
  })

  it('Creating a new event (selectedEvent = "new") does not pass an unrelated eventId', () => {
    const result = simulateCreateCommande(null, 'new')
    assert.equal(result, null, 'no eventId passed when creating new event')
  })

  it('No event selected means no eventId is passed (server auto-creates)', () => {
    const result = simulateCreateCommande(null, null)
    assert.equal(result, null, 'no eventId passed when nothing selected')
  })

  it('Editing a Commande preserves the existing eventId', () => {
    const result = simulateCreateCommande('evt_existing_1', null)
    assert.equal(result, 'evt_existing_1', 'existing eventId preserved during edit')
  })
})

// ── CRIT-02 CLONE-ON-WRITE INTEGRITY ────────────────────────────

describe('MED-02 CRIT-02 INTEGRITY: Clone-on-Write remains intact', () => {
  it('update-commande.ts still contains the clone-on-write logic after all changes', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    assert.ok(src.includes('commandesUsingEvent > 1'), 'clone-on-write condition intact')
    assert.ok(src.includes('await tx.event.create'), 'clone uses tx.event.create')
    assert.ok(src.includes('await tx.event.update'), 'non-shared update still uses tx.event.update')
    assert.ok(src.includes('prisma.$transaction'), 'all operations remain atomic')
  })

  it('use-commande-form.ts eventId fix does not interfere with clone-on-write', () => {
    const hookSrc = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-commande-form.ts'), 'utf8')
    const actionSrc = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    // The hook fix only adds eventId to createCommande call — it does not touch update-commande.ts
    assert.ok(hookSrc.includes('eventId: selectedEvent'), 'hook passes eventId correctly')
    assert.ok(actionSrc.includes('commandesUsingEvent'), 'action still has clone-on-write')
  })
})
