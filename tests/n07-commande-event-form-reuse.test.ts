/**
 * N-07 Commande reuses the shared Événement EventForm — Unit Tests
 *
 * Finding N-7 (UI DIVERGENCE): the Commande create/edit wizard rendered its own
 * `event-step.tsx` ("Informations de l'événement") built with PremiumField,
 * mock EVENT_TYPES and a FAKE availability (`dateHash % 3 !== 0`), duplicating
 * (and diverging from) the Événement EventForm's fields, validation and
 * availability behavior.
 *
 * Fix:
 *   - `event-step.tsx` now renders the SAME `EventForm` used by the Événement
 *     create/edit dialogs (mode="create"), via a thin adapter only — no field,
 *     label, validation or availability logic is duplicated in the Commandes
 *     feature.
 *   - `event-form.tsx` gained one additive OPTIONAL prop `onValuesChange` so the
 *     wizard can keep its commande hook state in sync live. The Événement
 *     dialogs do not pass it → behavior unchanged.
 *   - `use-commande-form` / `use-edit-commande-form` now hold the EventType enum
 *     directly (matching EventForm semantics) instead of conflicting French
 *     label maps, so the shared pill control round-trips correctly.
 *   - Pure mapping helpers live in `src/features/commandes/lib/event-form-adapter.ts`
 *     (the only module the commandes feature adds for this reuse).
 *
 * This file follows the tests/b01..n06 conventions: dependency-injected replicas
 * for pure mappings + fs source-contract checks — no @clerk/@prisma imports,
 * no @api/clients fetch, no DB.
 *
 * Run: npx tsx tests/n07-commande-event-form-reuse.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  commandeEventDefaultValues,
  eventValuesToState,
  type EventWizardState,
} from '../src/features/commandes/lib/event-form-adapter'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── 1. SOURCE CONTRACT ───────────────────────────────────────────────────────

describe('N-07 SOURCE CONTRACT: Commande renders the shared EventForm instead of a duplicate', () => {
  it('event-step.tsx renders the shared EventForm from the events feature (no duplicate form markup)', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/components/event-step.tsx'), 'utf8')
    assert.ok(src.includes('from "@/features/events/components/event-form"'), 'imports the SAME EventForm component')
    assert.ok(src.includes('<EventForm'), 'renders the shared EventForm')
    assert.ok(!src.includes('type="date"'), 'no duplicated date input inside the commandes feature')
    assert.ok(!src.includes('checkEventConflicts'), 'availability/conflict logic is not re-implemented (comes from EventForm)')
    assert.ok(!src.includes('EVENT_TYPES'), 'old mock event-type list is gone')
    assert.ok(!src.includes('PremiumField'), 'old private event-step field markup is gone')
  })

  it('the Événement create/edit dialogs still render the same EventForm', () => {
    const createSrc = readFileSync(resolve(SRC_ROOT, 'features/events/components/create-event-dialog.tsx'), 'utf8')
    const editSrc = readFileSync(resolve(SRC_ROOT, 'features/events/components/edit-event-dialog.tsx'), 'utf8')
    for (const src of [createSrc, editSrc]) {
      assert.ok(src.includes('from \'./event-form\''), 'dialog imports the shared EventForm')
      assert.ok(src.includes('<EventForm'), 'dialog renders the shared EventForm')
    }
  })

  it('EventForm remains the canonical form (fields, validation, availability, scroll)', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/events/components/event-form.tsx'), 'utf8')
    assert.ok(src.includes('createEventSchema'), 'uses the Event validation schema')
    assert.ok(src.includes('validationErrorMap'), 'uses the Event validation error map')
    assert.ok(src.includes('AvailabilityCard'), 'uses the shared availability card')
    assert.ok(src.includes('scrollToFirstError'), 'keeps scroll-to-first-error on submit')
    assert.ok(src.includes('data-field="name"'), 'field identity markers preserved')
    assert.ok(src.includes('onValuesChange?'), 'adapter sync hook is additive')
  })

  it('the commandes hooks hold the EventType enum directly (no divergent label maps)', () => {
    const createHook = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-commande-form.ts'), 'utf8')
    const editHook = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-edit-commande-form.ts'), 'utf8')
    for (const src of [createHook, editHook]) {
      assert.ok(!src.includes('FR_TO_EN_EVENT_TYPE'), 'label->enum map removed')
      assert.ok(!src.includes('const EVENT_TYPE_MAP'), 'enum->label map removed')
    }
    assert.ok(createHook.includes('setEventType(event.type)'), 'selected client event type stays as the server enum')
    assert.ok(createHook.includes('eventType: eventType || null'), 'payload sends the enum unchanged')
    assert.ok(editHook.includes('eventType: eventType || null'), 'edit payload sends the enum unchanged')
  })

  it('the wizard pages wire the shared form to the commande client/event context', () => {
    const createPage = readFileSync(resolve(SRC_ROOT, 'app/dashboard/commandes/new/page.tsx'), 'utf8')
    const editView = readFileSync(resolve(SRC_ROOT, 'app/dashboard/commandes/[id]/edit/commande-edit-view.tsx'), 'utf8')
    assert.ok(createPage.includes('clientId={client?.id}'), 'create page passes the commande clientId')
    assert.ok(editView.includes('clientId={client?.id}'), 'edit page passes the commande clientId')
    assert.ok(editView.includes('eventId={commande.event?.id ?? null}'), 'edit page excludes the linked event from its own conflict check')
  })

  it('server actions and the commande schema contract are untouched', () => {
    const createAction = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/create-commande.ts'), 'utf8')
    const schema = readFileSync(resolve(SRC_ROOT, 'features/commandes/validations/create-commande-schema.ts'), 'utf8')
    assert.ok(!createAction.includes('prisma.event.create'), 'no Event create outside the transaction')
    assert.ok(createAction.includes('await tx.event.create'), 'auto-created Event stays inside the transaction')
    assert.ok(schema.includes('items: z.array(commandeItemSchema).optional(),'), 'items stays optional WITHOUT a [] default')
  })
})

// ── 2. BEHAVIOR: event-form adapter mappings ─────────────────────────────────

const FULL_STATE: EventWizardState = {
  eventName: 'Mariage Lambert',
  eventType: 'WEDDING',
  eventDate: '2026-10-01',
  startTime: '18:00',
  endTime: '23:00',
  location: 'Riad, Marrakech',
  guests: 120,
  budget: 60000,
  eventStatus: 'CONFIRMED',
  contactPerson: 'Lambert',
  contactPhone: '+212 6 00 00 00 00',
  eventNotes: 'Cérémonie en soirée.',
}

describe('N-07 BEHAVIOR: commandeEventDefaultValues (wizard state -> EventForm values)', () => {
  it('maps every mirrored field and combines Date/Début/Fin into Date values', () => {
    const values = commandeEventDefaultValues(FULL_STATE, 'client_a')
    assert.equal(values.name, 'Mariage Lambert')
    assert.equal(values.type, 'WEDDING')
    assert.equal(values.status, 'CONFIRMED')
    assert.ok(values.startDate instanceof Date)
    assert.equal(values.startDate!.toISOString(), new Date('2026-10-01T18:00').toISOString())
    assert.ok(values.endDate instanceof Date)
    assert.equal(values.endDate!.toISOString(), new Date('2026-10-01T23:00').toISOString())
    assert.equal(values.location, 'Riad, Marrakech')
    assert.equal(values.guestCount, 120)
    assert.equal(values.budget, 60000)
    assert.equal(values.contactPerson, 'Lambert')
    assert.equal(values.contactPhone, '+212 6 00 00 00 00')
    assert.equal(values.notes, 'Cérémonie en soirée.')
    assert.equal(values.clientId, 'client_a')
  })

  it('empty/new-event state produces undefined fields with the EventForm defaults', () => {
    const values = commandeEventDefaultValues({
      eventName: '', eventType: '', eventDate: '', startTime: '', endTime: '',
      location: '', guests: 0, budget: 0, eventStatus: null,
      contactPerson: '', contactPhone: '', eventNotes: '',
    })
    assert.equal(values.name, undefined)
    assert.equal(values.type, undefined)
    assert.equal(values.status, undefined)
    assert.equal(values.startDate, undefined)
    assert.equal(values.endDate, undefined)
    assert.equal(values.guestCount, 10, 'tables fallback matches EventForm')
    assert.equal(values.budget, 0, 'budget fallback matches EventForm')
    assert.equal(values.clientId, undefined)
  })

  it('partial dates (date without time) are not combined into a false datetime', () => {
    const values = commandeEventDefaultValues({ ...FULL_STATE, startTime: '', endTime: '' })
    assert.equal(values.startDate, undefined)
    assert.equal(values.endDate, undefined)
  })
})

describe('N-07 BEHAVIOR: eventValuesToState (EventForm values -> wizard state)', () => {
  it('maps a submitted EventForm payload back into the wizard string state', () => {
    const next = eventValuesToState({
      name: 'Gala Annuel',
      type: 'HOLIDAY',
      status: 'PLANNED',
      startDate: new Date('2026-12-20T20:00:00'),
      endDate: new Date('2026-12-20T23:30:00'),
      location: 'Casablanca',
      guestCount: 150,
      budget: 80000,
      contactPerson: 'Sara',
      contactPhone: '+212 6 11 22 33 44',
      notes: 'Thème doré.',
    })
    assert.deepEqual(next, {
      eventName: 'Gala Annuel',
      eventType: 'HOLIDAY',
      eventStatus: 'PLANNED',
      eventDate: '2026-12-20',
      startTime: '20:00',
      endTime: '23:30',
      location: 'Casablanca',
      guests: 150,
      budget: 80000,
      contactPerson: 'Sara',
      contactPhone: '+212 6 11 22 33 44',
      eventNotes: 'Thème doré.',
    })
  })

  it('ignores empty/invalid values so untouched fields do not clobber wizard state', () => {
    const next = eventValuesToState({ startDate: new Date('nope'), endDate: undefined as unknown as Date })
    assert.deepEqual(next, {})

    const partial = eventValuesToState({ name: '', startDate: new Date('2026-06-15T09:30:00') })
    assert.deepEqual(partial, {
      eventName: '',
      eventDate: '2026-06-15',
      startTime: '09:30',
    })
  })

  it('never touches the commande client (EventForm clientId is display-only)', () => {
    const next = eventValuesToState({ clientId: 'other_client' })
    assert.equal((next as Record<string, unknown>).clientId, undefined, 'clientId is not part of the wizard event state')
  })
})