/**
 * B-14 Activity Pagination Validation — Unit Tests
 *
 * F/audit B-12: `get-activity.ts` was the only paginated action that had no
 * Zod validation and no integer/string normalization. All sibling actions
 * (payments, invoices, menus, events, clients, commandes) were already
 * remediated with the same inline convention:
 *
 *   const schema = z.object({
 *     page:  z.coerce.number().int().positive().optional(),
 *     limit: z.coerce.number().int().positive().optional(),
 *   });
 *
 *   safePage  = Math.max(1, Math.trunc(Number(parsed.data.page || 1)));
 *   safeLimit = Math.max(1, Math.min(100, Math.trunc(Number(parsed.data.limit || DEFAULT))));
 *
 * Fix (get-activity.ts only): input is parsed server-side with the same Zod
 * schema; invalid input returns `{ success: false, error: COMMON.INVALID_INPUT }`
 * (a stable generic message — raw Zod issues are never exposed); only
 * safePage/safeLimit reach Prisma skip/take, totalPages and the returned
 * pagination metadata. Tenant isolation, getOrganizationId(), assertCan,
 * withActionGuard and all feed logic are untouched.
 *
 * Test convention: faithful replicas of the schema + normalization semantics
 * (zod coerces via Number(); int + positive refines) and fs contract checks on
 * the actual source — same style as tests/b12-* / b13-*.
 *
 * Run: npx tsx tests/b14-activity-pagination-validation.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function readProjectFile(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

const DEFAULT_LIMIT = 20

type PaginationInput = { page?: unknown; limit?: unknown }

/**
 * Mirrors getActivitySchema (z.coerce.number().int().positive().optional()):
 * undefined passes through (optional); any other raw value is coerced via
 * Number() (like zod's z.coerce.number()); NaN, non-integers and non-positive
 * values are rejected (returns null = schema failure).
 */
function validatePagination(input: PaginationInput): { page?: number; limit?: number } | null {
  const out: { page?: number; limit?: number } = {}
  for (const key of ['page', 'limit'] as const) {
    const raw = input[key]
    if (raw === undefined) continue
    const num = Number(raw)
    if (!Number.isInteger(num) || num <= 0) return null
    out[key] = num
  }
  return out
}

/** Mirrors the get-activity.ts normalization (sibling convention). */
function normalizePagination(
  data: { page?: number; limit?: number },
  defaultLimit: number = DEFAULT_LIMIT,
): { safePage: number; safeLimit: number; skip: number } {
  const safePage = Math.max(1, Math.trunc(Number(data.page || 1)))
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(Number(data.limit || defaultLimit))))
  return { safePage, safeLimit, skip: (safePage - 1) * safeLimit }
}

describe('B-14 schema semantics: valid input passes', () => {
  it('valid page/limit are accepted and preserved', () => {
    assert.deepEqual(validatePagination({ page: 2, limit: 50 }), { page: 2, limit: 50 })
  })

  it('undefined fields default to page 1 / default limit via normalization', () => {
    const parsed = validatePagination({})
    assert.deepEqual(parsed, {})
    const norm = normalizePagination(parsed ?? {}, DEFAULT_LIMIT)
    assert.deepEqual({ page: norm.safePage, limit: norm.safeLimit }, { page: 1, limit: 20 })
  })

  it('numeric strings are coerced and accepted ("2", "25")', () => {
    assert.deepEqual(validatePagination({ page: '2', limit: '25' }), { page: 2, limit: 25 })
  })
})

describe('B-14 schema semantics: invalid input is rejected', () => {
  it('zero and negative values are rejected', () => {
    for (const input of [{ page: 0 }, { page: -1 }, { limit: 0 }, { limit: -5 }, { page: -1, limit: -1 }]) {
      assert.equal(validatePagination(input), null, `${JSON.stringify(input)} must fail the schema`)
    }
  })

  it('float values are rejected (int() refinement)', () => {
    for (const input of [{ page: 2.5 }, { limit: 10.9 }, { page: 1.0001 }, { limit: '2.5' }]) {
      assert.equal(validatePagination(input), null, `${JSON.stringify(input)} must fail the int() refinement`)
    }
  })

  it('non-numeric strings and empty strings are rejected', () => {
    for (const input of [{ page: 'two' }, { limit: 'abc' }, { page: '' }, { limit: '' }, { page: null }, { limit: '1e3foo' }]) {
      assert.equal(validatePagination(input), null, `${JSON.stringify(input)} must fail the schema`)
    }
  })
})

describe('B-14 normalization: only safe values reach skip/take', () => {
  it('limit greater than 100 is capped at 100', () => {
    const norm = normalizePagination(validatePagination({ page: 1, limit: 500 }) ?? { page: 1, limit: 20 })
    assert.equal(norm.safeLimit, 100)
    assert.equal(norm.skip, 0)
  })

  it('limit 100 is kept, skip uses safePage/safeLimit', () => {
    const norm = normalizePagination(validatePagination({ page: 3, limit: 100 }) ?? { page: 1, limit: 20 })
    assert.equal(norm.safeLimit, 100)
    assert.equal(norm.safePage, 3)
    assert.equal(norm.skip, 200)
  })

  it('a page beyond bounds still normalizes to page >= 1', () => {
    assert.equal(normalizePagination({ page: 0, limit: -5 }).safePage, 1)
    assert.equal(normalizePagination({ page: 0, limit: -5 }).safeLimit, 1)
  })
})

describe('B-14 source contract: get-activity.ts implements the audit', () => {
  const src = readProjectFile('src/features/activity/actions/get-activity.ts')

  it('defines a Zod schema with coerce + int + positive for both fields', () => {
    const occurrences = (src.match(/z\.coerce\.number\(\)\.int\(\)\.positive\(\)\.optional\(\)/g) ?? []).length
    assert.equal(occurrences, 2, 'both page and limit must use coerce/int/positive/optional')
    assert.ok(src.includes('const getActivitySchema = z.object({'), 'a getActivitySchema must exist')
  })

  it('parses server-side and fails closed without exposing raw Zod issues', () => {
    assert.ok(src.includes('getActivitySchema.safeParse(params ?? {})'), 'input must be parsed with safeParse')
    assert.ok(src.includes('COMMON.INVALID_INPUT'), 'invalid input must return the generic INVALID_INPUT message')
    assert.equal(src.includes('parsed.error.issues'), false, 'raw Zod issues must never be exposed to the client')
  })

  it('normalizes pagination with Math.trunc and sibling-style bounds', () => {
    assert.ok(
      src.includes('const safePage = Math.max(1, Math.trunc(Number(parsed.data.page || 1)))'),
      'safePage must use the sibling normalization',
    )
    assert.ok(
      src.includes('const safeLimit = Math.max(1, Math.min(100, Math.trunc(Number(parsed.data.limit || ACTIVITY_DEFAULT_PAGE_SIZE))))'),
      'safeLimit must use the sibling normalization with default page size',
    )
  })

  it('only safe values reach Prisma skip/take and pagination metadata', () => {
    assert.ok(src.includes('const skip = (safePage - 1) * safeLimit'), 'skip must derive from safe values')
    assert.ok(src.includes('skip,'), 'findMany must use the normalized skip')
    assert.ok(src.includes('take: safeLimit'), 'findMany must take safeLimit')
    assert.equal(src.includes('take: limit'), false, 'no raw limit may reach take')
    assert.ok(src.includes('const totalPages = Math.ceil(total / safeLimit)'), 'totalPages must use safeLimit')
    assert.ok(src.includes('pagination: ActivityPagination = { page: safePage, limit: safeLimit, total, totalPages }'), 'pagination metadata must expose safe values')
  })

  it('tenant-scoped organization filter remains intact', () => {
    const scoped = (src.match(/where: \{ commande: \{ organizationId \} \}/g) ?? []).length
    assert.ok(scoped >= 2, 'count and findMany must both stay scoped to the organization')
  })

  it('authz, guard and org resolution are preserved', () => {
    assert.ok(src.includes('await assertCan(\'dashboard\', \'view\')'), 'assertCan must be preserved')
    assert.ok(src.includes('const organizationId = await getOrganizationId()'), 'getOrganizationId must be preserved')
    assert.ok(src.includes("withActionGuard(getActivityHandler, { name: 'dashboard:view' })"), 'withActionGuard must be preserved')
  })
})