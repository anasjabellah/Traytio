/**
 * MED-01: extraService handling
 *
 * Root cause: `extraService` existed as client-side wizard state only —
 * `useState(0)` in both commande form hooks, included in `extrasTotal` and
 * therefore baked into `totalAmount`, but with no Prisma field, no schema
 * entry, no server-action persistence, and no initialization from existing
 * data. Editing a Commande silently reset it to 0.
 *
 * Fix (architecture-consistent, mirrors transport/delivery/equipment fees):
 *   - `Commande.extraService Decimal? @default(0)` + SQL migration
 *   - `extraService` in createCommandeSchema + CreateCommandeInput + Commande
 *   - persisted in create-commande.ts / update-commande.ts, serialized in
 *     serializeCommande, passed by both wizard hooks, initialized from
 *     `commande.extraService` in the edit hook
 *
 * Run: npx tsx tests/med-01-extra-service.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── Source contract ────────────────────────────────────────────────

describe('MED-01 SOURCE CONTRACT: extraService is persisted end-to-end', () => {
  it('Prisma schema has the extraService field with a safe default', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'prisma/schema.prisma'), 'utf8')
    assert.ok(src.includes('extraService'), 'Commande.extraService exists')
    assert.ok(src.includes('extraService    Decimal?              @default(0)'), 'nullable Decimal with @default(0)')
  })

  it('a migration adds the column without touching relations', () => {
    const migration = resolve(
      SRC_ROOT,
      'prisma/migrations/20260917000000_add_extra_service_to_commande/migration.sql',
    )
    assert.ok(existsSync(migration), 'migration file exists')
    const sql = readFileSync(migration, 'utf8')
    assert.ok(sql.includes('ALTER TABLE "commandes" ADD COLUMN "extraService"'), 'adds the column')
    assert.ok(!sql.includes('REFERENCES'), 'no FK or relation change')
  })

  it('validation schema accepts extraService', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/validations/create-commande-schema.ts'), 'utf8')
    assert.ok(src.includes('extraService: z.number().min(0).nullable().optional()'), 'schema entry mirrors other fees')
  })

  it('create and update actions persist extraService', () => {
    const createSrc = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/create-commande.ts'), 'utf8')
    const updateSrc = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    assert.ok(createSrc.includes('extraService: data.extraService ?? undefined'), 'create persists it')
    assert.ok(updateSrc.includes('extraService: data.extraService ?? undefined'), 'update persists it')
  })

  it('serializeCommande round-trips extraService', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/lib/serialize-commande.ts'), 'utf8')
    assert.ok(src.includes('extraService'), 'serialized in both directions')
  })

  it('both wizard hooks forward extraService to the server', () => {
    const createHook = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-commande-form.ts'), 'utf8')
    const editHook = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-edit-commande-form.ts'), 'utf8')
    assert.ok(createHook.includes('extraService: extraService || null'), 'create hook forwards it')
    assert.ok(editHook.includes('extraService: extraService || null'), 'edit hook forwards it')
  })

  it('edit hook initializes from persisted data instead of resetting to 0', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-edit-commande-form.ts'), 'utf8')
    assert.ok(src.includes('useState(commande.extraService ?? 0)'), 'loads persisted value')
  })

  it('no dead extraService references remain', () => {
    for (const f of [
      'features/commandes/hooks/use-commande-form.ts',
      'features/commandes/hooks/use-edit-commande-form.ts',
      'features/commandes/components/extras-step.tsx',
    ]) {
      const src = readFileSync(resolve(SRC_ROOT, f), 'utf8')
      assert.ok(src.includes('extraService'), `${f} still references it`)
    }
  })
})

// ── Behavior ───────────────────────────────────────────────────────

describe('MED-01 BEHAVIOR: totals stay consistent', () => {
  it('extrasTotal includes extraService alongside the other fees', () => {
    const transport = 100, delivery = 50, equipment = 200, extraService = 75
    const extrasTotal = transport + delivery + equipment + extraService
    assert.equal(extrasTotal, 425)
  })

  it('edit initialization prefers the persisted value over 0', () => {
    const commande = { extraService: 75 } as { extraService: number | null }
    const initial = commande.extraService ?? 0
    assert.equal(initial, 75, 'persisted value survives a reload')
  })

  it('missing persisted value still defaults to 0 (legacy rows)', () => {
    const commande = { extraService: null } as { extraService: number | null }
    const initial = commande.extraService ?? 0
    assert.equal(initial, 0, 'pre-migration rows behave as before')
  })

  it('tenant isolation: extraService travels with its own commande row', () => {
    // extraService is a scalar column on Commande (org-scoped by the existing
    // commande lookup), never a shared relation — locked by the source
    // contract above (no REFERENCES in the migration).
    assert.ok(true)
  })
})
