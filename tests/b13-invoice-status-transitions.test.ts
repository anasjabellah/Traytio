/**
 * B-13 Invoice Status Integrity — minimal business-rule hardening — Unit Tests
 *
 * F-11 hardening (OPTIONAL business-rule enforcement, not a vulnerability fix):
 *
 * 1. PAID is terminal in updateInvoiceStatus
 *    - PAID -> PAID (no-op) is allowed.
 *    - PAID -> any other InvoiceStatus is rejected server-side.
 *    - Every other transition stays exactly as before (no state machine).
 *    - Authorization, tenant isolation, rate limiting and validation are
 *      untouched: the handler still resolves organizationId, asserts
 *      `invoices:update`, scopes reads/writes by { id, organizationId }, and
 *      enum-validates via updateInvoiceStatusSchema. Only the terminal guard
 *      was added.
 *
 * 2. The UI rule "a REJECTED devis cannot be converted to a facture" is now
 *    authoritative on the server in convertQuoteToInvoice:
 *    - quote.status === "REJECTED" -> conversion rejected.
 *    - All other statuses -> conversion allowed (unchanged behavior).
 *    - No CANCELLED status was added; no dueDate logic; no payment/balance
 *      math was touched.
 *
 * Test convention: faithful replicas of the new guard logic (truth-table
 * tests) + fs contract checks on the actual source tree (no transitive deps),
 * same style as tests/b11-* and tests/b12-*.
 *
 * Run: npx tsx tests/b13-invoice-status-transitions.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function readProjectFile(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

// ── Guard replicas: faithful to the implemented rules ──

const INVOICE_STATUSES = ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'PAID', 'OVERDUE'] as const

/** Mirrors the updateInvoiceStatusHandler guard: only PAID -> non-PAID is blocked. */
function canTransitionStatus(current: string, target: string): boolean {
  if (current === 'PAID' && target !== 'PAID') return false
  return true
}

/** Mirrors the convertQuoteToInvoice guard: only REJECTED quotes are blocked. */
function canConvertQuote(status: string): boolean {
  return status !== 'REJECTED'
}

describe('B-13 PAID is terminal in updateInvoiceStatus', () => {
  it('PAID -> PAID is allowed (no-op)', () => {
    assert.equal(canTransitionStatus('PAID', 'PAID'), true)
  })

  it('PAID -> DRAFT is rejected', () => {
    assert.equal(canTransitionStatus('PAID', 'DRAFT'), false)
  })

  it('PAID -> SENT is rejected', () => {
    assert.equal(canTransitionStatus('PAID', 'SENT'), false)
  })

  it('PAID -> VIEWED is rejected', () => {
    assert.equal(canTransitionStatus('PAID', 'VIEWED'), false)
  })

  it('PAID -> ACCEPTED is rejected', () => {
    assert.equal(canTransitionStatus('PAID', 'ACCEPTED'), false)
  })

  it('PAID -> REJECTED is rejected', () => {
    assert.equal(canTransitionStatus('PAID', 'REJECTED'), false)
  })

  it('PAID -> OVERDUE is rejected', () => {
    assert.equal(canTransitionStatus('PAID', 'OVERDUE'), false)
  })
})

describe('B-13 all non-PAID transitions remain allowed', () => {
  it('every non-PAID source still reaches every target (no state machine introduced)', () => {
    const nonPaid = INVOICE_STATUSES.filter(s => s !== 'PAID')
    for (const source of nonPaid) {
      for (const target of INVOICE_STATUSES) {
        assert.equal(
          canTransitionStatus(source, target),
          true,
          `${source} -> ${target} must stay allowed`,
        )
      }
    }
  })

  it('representative happy-path transitions still pass (DRAFT -> SENT -> VIEWED -> ACCEPTED -> PAID)', () => {
    assert.equal(canTransitionStatus('DRAFT', 'SENT'), true)
    assert.equal(canTransitionStatus('SENT', 'VIEWED'), true)
    assert.equal(canTransitionStatus('VIEWED', 'ACCEPTED'), true)
    assert.equal(canTransitionStatus('ACCEPTED', 'PAID'), true)
  })

  it('REJECTED -> DRAFT (revision) and overdue recovery remain allowed', () => {
    assert.equal(canTransitionStatus('REJECTED', 'DRAFT'), true)
    assert.equal(canTransitionStatus('OVERDUE', 'PAID'), true)
    assert.equal(canTransitionStatus('OVERDUE', 'ACCEPTED'), true)
  })
})

describe('B-13 REJECTED devis conversion rule (server-side)', () => {
  it('REJECTED devis -> FACTURE is rejected server-side', () => {
    assert.equal(canConvertQuote('REJECTED'), false)
  })

  it('non-REJECTED devis conversion remains allowed', () => {
    const convertible = INVOICE_STATUSES.filter(s => s !== 'REJECTED')
    for (const status of convertible) {
      assert.equal(canConvertQuote(status), true, `${status} devis must stay convertible`)
    }
  })
})

describe('B-13 source contract: the implemented guards are present', () => {
  it('updateInvoiceStatusHandler blocks PAID -> non-PAID before writing', () => {
    const src = readProjectFile('src/features/invoices/actions/invoice-actions.ts')
    assert.ok(
      src.includes('existing.status === "PAID" && parsed.data.status !== "PAID"'),
      'the PAID-terminal guard must be in the handler',
    )
    assert.ok(
      src.includes('INVOICE.UPDATE.STATUS.PAID_TERMINAL'),
      'the terminal rejection must return the PAID_TERMINAL message',
    )
  })

  it('convertQuoteToInvoice rejects REJECTED quotes', () => {
    const src = readProjectFile('src/features/invoices/actions/invoice-actions.ts')
    assert.ok(
      src.includes('quote.status === "REJECTED"'),
      'the REJECTED-quote guard must be in convertQuoteToInvoice',
    )
    assert.ok(
      src.includes('INVOICE.CONVERT.QUOTE_REJECTED'),
      'the conversion rejection must return the QUOTE_REJECTED message',
    )
  })

  it('tenant isolation is preserved on the status-update path', () => {
    const src = readProjectFile('src/features/invoices/actions/invoice-actions.ts')
    const scoped = (src.match(/where: \{ id, organizationId \}/g) ?? []).length
    assert.ok(scoped >= 2, 'findFirst + update must both be scoped by { id, organizationId }')
  })

  it('tenant isolation is preserved on the conversion path', () => {
    const src = readProjectFile('src/features/invoices/actions/invoice-actions.ts')
    assert.ok(
      src.includes('where: { id: parsed.data.quoteId, organizationId, type: "DEVIS" }'),
      'quote lookup must stay scoped by organizationId and DEVIS type',
    )
  })

  it('no CANCELLED status or dueDate-based status logic were introduced', () => {
    const src = readProjectFile('src/features/invoices/actions/invoice-actions.ts')
    assert.equal(src.includes('"CANCELLED"'), false, 'CANCELLED must not be introduced')
    // updateInvoiceStatusHandler must not read dueDate (creation paths untouched).
    const handlerSlice =
      src.slice(src.indexOf('async function updateInvoiceStatusHandler'), src.indexOf('export const updateInvoiceStatus'))
    assert.equal(handlerSlice.includes('dueDate'), false, 'the PAID-terminal guard must not involve dueDate')
    // The conversion guard is status-only and not dueDate-based.
    assert.ok(/if \(quote\.status === "REJECTED"\)/.test(src), 'conversion guard must be status-only')
  })
})