/**
 * S-7 Global search minimum query length — Unit Tests
 *
 * Finding S-7 (DEFENSE-IN-DEPTH): global search accepted single-character
 * queries that would trigger 8 parallel ILIKE '%term%' scans. A 2-char
 * minimum reduces noisy broad scans without affecting useful searches.
 *
 * Fix:
 *   - search-global.ts: added `trimmed.length < 2` guard after the existing
 *     empty-string check, returning an empty result without reaching any DB
 *     query. Schema max(100) unchanged; org-scoping, take:5, rate-limit,
 *     authorization, and 250ms UI debounce unchanged.
 *
 * This file follows the b01..n06 conventions: dependency-injected replicas +
 * fs source-contract checks — no @clerk/@prisma imports, no DB.
 *
 * Run: npx tsx tests/s7-global-search-min-length.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── Types ────────────────────────────────────────────────────────────────────

interface SearchResultItem {
  id: string
  label: string
  subtitle: string
  href: string
  badge?: string
}

type GlobalSearchResults = Record<string, SearchResultItem[]>

const EMPTY: GlobalSearchResults = {
  clients: [],
  commandes: [],
  invoices: [],
  events: [],
  payments: [],
  menus: [],
  menuItems: [],
  members: [],
}

type WireResult = { success: boolean; data?: GlobalSearchResults; error?: string }

// ── DB mock ──────────────────────────────────────────────────────────────────

function makeDb() {
  let queryCount = 0
  return {
    get queryCount() { return queryCount },
    reset() { queryCount = 0 },
    execQueries(): GlobalSearchResults {
      queryCount += 8 // 8 parallel findMany queries
      return {
        clients: [], commandes: [], invoices: [], events: [],
        payments: [], menus: [], menuItems: [], members: [],
      }
    },
  }
}

// ── Wire: faithful to the FIXED search-global.ts handler ──────────────────────
// The guard below mirrors: schema max(100) → trimmed → trimmed.length < 2
// then 8 parallel org-scoped findMany queries.

function searchGlobalHandler(db: ReturnType<typeof makeDb>, query: string): WireResult {
  // Schema gate (z.string().max(100) from search-global.ts)
  if (typeof query !== 'string' || query.length > 100) {
    return { success: false, error: 'UNEXPECTED_ERROR' }
  }

  const trimmed = query.trim()
  // Min-length guard (matches trimmed.length < 2 in search-global.ts)
  if (trimmed.length < 2) {
    return { success: true, data: EMPTY }
  }

  return { success: true, data: db.execQueries() }
}

// ── 1. SOURCE CONTRACT ───────────────────────────────────────────────────────

describe('S-7 SOURCE CONTRACT: global search minimum query length', () => {
  const src = readFileSync(resolve(SRC_ROOT, 'features/search/actions/search-global.ts'), 'utf8')

  it('contains trimmed.length < 2 guard before any DB queries', () => {
    assert.ok(src.includes('trimmed.length < 2'), 'min-length guard must use trimmed.length < 2')
  })

  it('returns success: true with empty result for terms shorter than 2 chars', () => {
    const guardIdx = src.indexOf('trimmed.length < 2')
    const successIdx = src.indexOf('success: true', guardIdx)
    assert.ok(successIdx !== -1 && successIdx - guardIdx < 500,
      'short-term branch must immediately return success: true without reaching DB')
    assert.ok(src.includes('clients: []'), 'empty response includes clients: []')
  })

  it('preserves the max(100) Zod schema validation', () => {
    assert.ok(src.includes('z.string().max(100)'), 'schema must enforce max 100 characters')
  })

  it('requires action guard with name "search:global" for rate limiting and CSRF', () => {
    assert.ok(
      src.includes('withActionGuard(searchGlobalHandler, { name: "search:global" })') ||
      src.includes("withActionGuard(searchGlobalHandler, { name: 'search:global' })"),
      'action guard must use name "search:global"',
    )
  })

  it('scopes every query by organizationId from the server-derived membership', () => {
    assert.ok(src.includes('const orgId = membership.organizationId'),
      'orgId must come from server-side getCurrentMembership()')
    const orgIdMatches = src.match(/organizationId:\s*orgId/g)
    assert.ok(
      orgIdMatches && orgIdMatches.length >= 7,
      `expected at least 7 organizationId: orgId filters (8 tables: clients, commandes, invoices, events, payments, menus, menuItems, members), found ${orgIdMatches?.length ?? 0}`,
    )
  })

  it('limits all 8 queries with take: 5', () => {
    const takeMatches = src.match(/take:\s*5/g)
    assert.ok(
      takeMatches && takeMatches.length >= 8,
      `expected at least 8 take: 5 limits (one per findMany), found ${takeMatches?.length ?? 0}`,
    )
  })

  it('fires all 8 queries in parallel via Promise.all', () => {
    assert.ok(src.includes('await Promise.all(['), 'queries must run in parallel with Promise.all')
    const findManyMatches = src.match(/prisma\.\w+\.findMany\(\{/g)
    assert.ok(
      findManyMatches && findManyMatches.length >= 8,
      `expected at least 8 findMany queries, found ${findManyMatches?.length ?? 0}`,
    )
  })

  it('uses Prisma mode: "insensitive" for ILIKE matching on every search field', () => {
    const insensitiveMatches = src.match(/mode:\s*"insensitive"/g)
    assert.ok(
      insensitiveMatches && insensitiveMatches.length >= 7,
      `expected at least 7 insensitive mode flags, found ${insensitiveMatches?.length ?? 0}`,
    )
  })
})

// ── 2. BEHAVIOR: short terms return empty, 2+ char terms search ─────────────

describe('S-7 BEHAVIOR: search-global minimum query length', () => {
  it('empty string returns empty results with no DB queries', () => {
    const db = makeDb()
    const res = searchGlobalHandler(db, '')
    assert.deepEqual(res, { success: true, data: EMPTY })
    assert.equal(db.queryCount, 0, 'no DB queries for empty term')
  })

  it('whitespace-only string returns empty results with no DB queries', () => {
    const db = makeDb()
    const res = searchGlobalHandler(db, '   ')
    assert.deepEqual(res, { success: true, data: EMPTY })
    assert.equal(db.queryCount, 0, 'no DB queries for whitespace-only term')
  })

  it('single character returns empty results with no DB queries', () => {
    const db = makeDb()
    const res = searchGlobalHandler(db, 'a')
    assert.deepEqual(res, { success: true, data: EMPTY })
    assert.equal(db.queryCount, 0, 'no DB queries for 1-char term')
  })

  it('single character with surrounding spaces returns empty results', () => {
    const db = makeDb()
    const res = searchGlobalHandler(db, '  a  ')
    assert.deepEqual(res, { success: true, data: EMPTY })
    assert.equal(db.queryCount, 0, 'no DB queries when trimmed result is 1 char')
  })

  it('two-character term fires all 8 DB queries', () => {
    const db = makeDb()
    const res = searchGlobalHandler(db, 'ab')
    assert.equal(res.success, true, '2-char term must be accepted')
    assert.ok(res.data, 'response must include data')
    assert.equal(db.queryCount, 8, 'exactly 8 DB queries for a 2-char term')
  })

  it('three-character term still fires all 8 DB queries', () => {
    const db = makeDb()
    const res = searchGlobalHandler(db, 'abc')
    assert.equal(res.success, true, '3-char term must be accepted')
    assert.equal(db.queryCount, 8, '8 queries for a 3-char term')
  })

  it('query of exactly 100 characters fires all 8 DB queries', () => {
    const db = makeDb()
    const res = searchGlobalHandler(db, 'a'.repeat(100))
    assert.equal(res.success, true, '100-char term must be accepted')
    assert.equal(db.queryCount, 8, '8 queries for a 100-char term')
  })

  it('query exceeding 100 characters is rejected with no DB queries', () => {
    const db = makeDb()
    const res = searchGlobalHandler(db, 'a'.repeat(101))
    assert.equal(res.success, false, 'max-length violation returns success: false')
    assert.equal(db.queryCount, 0, 'no DB queries for >100 char term')
  })
})
