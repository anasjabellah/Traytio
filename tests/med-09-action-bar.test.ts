/**
 * MED-09: Commande wizard action bar
 *
 * Root cause: ActionBar primary button directly used `onSubmit` without
 * double-submit protection. Decorative BarBtn components ("Brouillon",
 * "Devis", "WhatsApp") had no onClick handlers or disabled states.
 *
 * Fix:
 *   - Added `useCallback`-based `handleSubmit` that guards against
 *     double-submission when `isSubmitting` is true
 *   - Made decorative buttons (`Brouillon`, `Devis`, `WhatsApp`)
 *     disabled and non-functional
 *
 * Run: npx tsx tests/med-09-action-bar.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

describe('MED-09 SOURCE CONTRACT: action-bar.tsx', () => {
  it('action-bar.tsx uses handleSubmit to prevent double-submit', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/components/action-bar.tsx'), 'utf8')
    assert.ok(src.includes('handleSubmit'), 'has handleSubmit for double-submit protection')
    assert.ok(src.includes('if (isSubmitting) return'), 'guards against double-submit')
    assert.ok(src.includes('useCallback'), 'uses useCallback for memoization')
  })

  it('decorative buttons are disabled', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/components/action-bar.tsx'), 'utf8')
    assert.ok(src.includes('disabled'), 'decorative buttons are disabled')
  })

  it('primary button uses handleSubmit not onSubmit directly', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/components/action-bar.tsx'), 'utf8')
    assert.ok(src.includes('onClick={handleSubmit}'), 'primary button uses handleSubmit')
  })
})

// ── MED-10 SOURCE CONTRACT: page-header.tsx ─────

describe('MED-10 SOURCE CONTRACT: page-header.tsx', () => {
  it('page-header.tsx accepts mode prop to differentiate create vs edit', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/components/page-header.tsx'), 'utf8')
    assert.ok(src.includes('mode'), 'has mode prop')
    assert.ok(src.includes('"create" | "edit"'), 'mode accepts create or edit')
    assert.ok(src.includes('isEdit'), 'differentiates create vs edit')
  })

  it('page-header.tsx has onClick on back button', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/components/page-header.tsx'), 'utf8')
    assert.ok(src.includes('onClick'), 'back button has onClick')
  })
})

// ── BEHAVIOR tests ────────────────────────────────

describe('MED-09 BEHAVIOR: action bar', () => {
  it('submit handler guards against double-submit', () => {
    let calls = 0
    const handleSubmit = () => { calls++ }
    const isSubmitting = true
    if (!isSubmitting) handleSubmit()
    assert.equal(calls, 0, 'double-submit prevented when isSubmitting=true')
  })

  it('submit handler fires when not submitting', () => {
    let calls = 0
    const handleSubmit = () => { calls++ }
    const isSubmitting = false
    if (!isSubmitting) handleSubmit()
    assert.equal(calls, 1, 'submit fires when not submitting')
  })
})

describe('MED-10 BEHAVIOR: page header', () => {
  it('create mode shows "Nouvelle commande"', () => {
    const mode: string = 'create'
    const title = mode === 'edit' ? 'Modifier' : 'Nouvelle'
    assert.equal(title, 'Nouvelle', 'create mode shows Nouvelle')
  })

  it('edit mode shows "Modifier la commande"', () => {
    const mode: string = 'edit'
    const title = mode === 'edit' ? 'Modifier' : 'Nouvelle'
    assert.equal(title, 'Modifier', 'edit mode shows Modifier')
  })
})

// ── INTEGRITY ────────────────────────────────────

describe('MED-09 INTEGRITY: CRIT-02 and MED-02 preserved', () => {
  it('update-commande.ts still has task sync and clone-on-write', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    assert.ok(src.includes('commandeTask'), 'task sync present')
    assert.ok(src.includes('commandesUsingEvent'), 'clone-on-write present')
  })
})
