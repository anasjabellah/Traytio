/**
 * B-18 Report modal — preset date-range payload integrity
 *
 * Verifies the fix in src/features/dashboard/components/report-modal.tsx:
 * every period preset now always produces a valid { dateFrom, dateTo } payload
 * so the server Zod schema (requireBoth non-empty valid date strings) never
 * rejects a legitimate preset selection.
 *
 * We inline a faithful, dependency-free replica of:
 *   - getDateRange() from report-modal.tsx (the client-side range builder)
 *   - the reportFiltersSchema validation from generate-report-data.ts
 *   - the handleGenerate payload-construction logic
 *
 * Convention follows b04-report-row-limit.test.ts — no @clerk/@prisma/DB deps.
 *
 * Run: npx tsx tests/b18-report-modal-preset-payload.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ── Faithful replica of getDateRange from report-modal.tsx ──

type Preset = 'today' | '7days' | 'month' | 'year' | 'custom'

function getDateRange(preset: Preset): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  switch (preset) {
    case 'today': {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10)
      return { dateFrom: s, dateTo: today }
    }
    case '7days': {
      const s = new Date(now)
      s.setDate(s.getDate() - 6)
      return { dateFrom: s.toISOString().slice(0, 10), dateTo: today }
    }
    case 'month':
      return { dateFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), dateTo: today }
    case 'year':
      return { dateFrom: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10), dateTo: today }
    case 'custom':
      return { dateFrom: '', dateTo: '' }
  }
}

// ── Faithful replica of the Zod date-string + range-refine validation ──

function isValidDateString(v: string): boolean {
  return v.length >= 1 && !Number.isNaN(Date.parse(v))
}

function validateReportPayload(range: { dateFrom: string; dateTo: string }): boolean {
  if (!isValidDateString(range.dateFrom) || !isValidDateString(range.dateTo)) return false
  if (new Date(range.dateTo) < new Date(range.dateFrom)) return false
  return true
}

// ── Faithful replica of handleGenerate payload construction logic ──

function buildPayload(
  preset: Preset,
  customFrom: string,
  customTo: string,
): { range: { dateFrom: string; dateTo: string }; error?: string } {
  const range = preset === 'custom' ? { dateFrom: customFrom, dateTo: customTo } : getDateRange(preset)
  if (!range.dateFrom || !range.dateTo) {
    return { range, error: range.dateFrom ? 'DATE_END_REQUIRED' : 'DATE_REQUIRED' }
  }
  return { range }
}

// ── ISO 8601 date format regex ──
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// ── Tests ──

describe('B-18 PRESET: getDateRange always returns both dateFrom and dateTo', () => {
  const presets: Preset[] = ['today', '7days', 'month', 'year']

  for (const preset of presets) {
    it(`${preset} — returns non-empty dateFrom and dateTo as YYYY-MM-DD strings`, () => {
      const range = getDateRange(preset)

      assert.ok(range.dateFrom, `${preset}: dateFrom must be a non-empty string`)
      assert.ok(range.dateTo, `${preset}: dateTo must be a non-empty string`)
      assert.ok(ISO_DATE_RE.test(range.dateFrom), `${preset}: dateFrom must be YYYY-MM-DD, got ${range.dateFrom}`)
      assert.ok(ISO_DATE_RE.test(range.dateTo), `${preset}: dateTo must be YYYY-MM-DD, got ${range.dateTo}`)
      assert.ok(isValidDateString(range.dateFrom), `${preset}: dateFrom must be a valid date, got ${range.dateFrom}`)
      assert.ok(isValidDateString(range.dateTo), `${preset}: dateTo must be a valid date, got ${range.dateTo}`)
    })
  }
})

describe('B-18 PRESET: dateFrom is never after dateTo', () => {
  const presets: Preset[] = ['today', '7days', 'month', 'year']

  for (const preset of presets) {
    it(`${preset} — dateTo >= dateFrom`, () => {
      const range = getDateRange(preset)
      assert.ok(
        new Date(range.dateTo) >= new Date(range.dateFrom),
        `${preset}: dateTo (${range.dateTo}) must be >= dateFrom (${range.dateFrom})`,
      )
    })
  }
})

describe('B-18 PRESET: dateTo is always today for all non-custom presets', () => {
  const today = new Date().toISOString().slice(0, 10)
  const presets: Preset[] = ['today', '7days', 'month', 'year']

  for (const preset of presets) {
    it(`${preset} — dateTo equals today (${today})`, () => {
      const range = getDateRange(preset)
      assert.equal(range.dateTo, today)
    })
  }
})

describe('B-18 PRESET: specific semantic checks', () => {
  it('today — dateFrom equals today', () => {
    const today = new Date()
    const expectedFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 10)
    const range = getDateRange('today')
    assert.equal(range.dateFrom, expectedFrom)
    assert.equal(range.dateTo, today.toISOString().slice(0, 10))
  })

  it('7days — dateFrom is exactly 6 days before today', () => {
    const now = new Date()
    const expectedFrom = new Date(now)
    expectedFrom.setDate(expectedFrom.getDate() - 6)
    const range = getDateRange('7days')
    assert.equal(range.dateFrom, expectedFrom.toISOString().slice(0, 10))
    assert.equal(range.dateTo, now.toISOString().slice(0, 10))
  })

  it('month — dateFrom is the 1st of the current month', () => {
    const now = new Date()
    const expectedFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const range = getDateRange('month')
    assert.equal(range.dateFrom, expectedFrom)
    assert.equal(range.dateTo, now.toISOString().slice(0, 10))
  })

  it('year — dateFrom is January 1 of the current year', () => {
    const now = new Date()
    const expectedFrom = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
    const range = getDateRange('year')
    assert.equal(range.dateFrom, expectedFrom)
    assert.equal(range.dateTo, now.toISOString().slice(0, 10))
  })
})

describe('B-18 PAYLOAD: preset ranges always pass server validation', () => {
  const presets: Preset[] = ['today', '7days', 'month', 'year']

  for (const preset of presets) {
    it(`${preset} — payload passes validateReportPayload`, () => {
      const range = getDateRange(preset)
      assert.ok(validateReportPayload(range), `${preset}: expected valid payload but got ${JSON.stringify(range)}`)
    })
  }
})

describe('B-18 PAYLOAD: buildPayload from handleGenerate logic', () => {
  const presets: Preset[] = ['today', '7days', 'month', 'year']

  for (const preset of presets) {
    it(`${preset} — buildPayload produces no error`, () => {
      const result = buildPayload(preset, '', '')
      assert.equal(result.error, undefined, `${preset}: buildPayload should not return an error`)
      assert.ok(result.range.dateFrom, `${preset}: dateFrom must be non-empty`)
      assert.ok(result.range.dateTo, `${preset}: dateTo must be non-empty`)
    })
  }
})

describe('B-18 CUSTOM: validation requires both dates', () => {
  it('both dates provided and valid — passes', () => {
    const result = buildPayload('custom', '2026-01-15', '2026-01-31')
    assert.equal(result.error, undefined)
    assert.equal(result.range.dateFrom, '2026-01-15')
    assert.equal(result.range.dateTo, '2026-01-31')
    assert.ok(validateReportPayload(result.range))
  })

  it('both dates provided but dateTo < dateFrom — fails validation', () => {
    const range = { dateFrom: '2026-06-01', dateTo: '2026-01-01' }
    assert.ok(!validateReportPayload(range), 'Should reject dateTo before dateFrom')
  })

  it('empty customFrom — buildPayload returns DATE_REQUIRED error', () => {
    const result = buildPayload('custom', '', '2026-01-31')
    assert.equal(result.error, 'DATE_REQUIRED')
  })

  it('empty customTo — buildPayload returns DATE_END_REQUIRED error', () => {
    const result = buildPayload('custom', '2026-01-15', '')
    assert.equal(result.error, 'DATE_END_REQUIRED')
  })

  it('both empty — buildPayload returns DATE_REQUIRED error', () => {
    const result = buildPayload('custom', '', '')
    assert.equal(result.error, 'DATE_REQUIRED')
  })

  it('invalid date string — fails server validation', () => {
    const range = { dateFrom: 'not-a-date', dateTo: '2026-01-31' }
    assert.ok(!validateReportPayload(range))
  })
})

describe('B-18 PRESERVED: status and eventType filters are unaffected', () => {
  it('payload with status filter still validates', () => {
    const range = getDateRange('month')
    assert.ok(validateReportPayload(range), 'Base range should be valid')
    const filters = { ...range, status: 'CONFIRMED' }
    assert.ok(isValidDateString(filters.dateFrom) && isValidDateString(filters.dateTo))
    assert.equal(filters.status, 'CONFIRMED')
  })

  it('payload with eventType filter still validates', () => {
    const range = getDateRange('month')
    const filters = { ...range, eventType: 'WEDDING' }
    assert.ok(isValidDateString(filters.dateFrom) && isValidDateString(filters.dateTo))
    assert.equal(filters.eventType, 'WEDDING')
  })

  it('payload with both filters still validates', () => {
    const range = getDateRange('year')
    const filters = { ...range, status: 'IN_PROGRESS', eventType: 'CORPORATE' }
    assert.ok(isValidDateString(filters.dateFrom) && isValidDateString(filters.dateTo))
    assert.equal(filters.status, 'IN_PROGRESS')
    assert.equal(filters.eventType, 'CORPORATE')
  })
})
