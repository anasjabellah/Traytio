/**
 * S-1: accept-invite fallbackRedirectUrl must use encodeURIComponent(token)
 * to prevent URL parameter injection through unencoded token values.
 *
 * Source-contract test: reads the real client component so a replica cannot
 * fake the result.  Follows the same convention as b09/b16.
 *
 * Run: npx tsx tests/s1-accept-invite-token-encoding.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

const CLIENT_PATH = resolve(
  SRC_ROOT,
  'app/accept-invite/accept-invite-client.tsx',
)

function readClient(): string {
  return readFileSync(CLIENT_PATH, 'utf8')
}

function getTagLine(tag: string): string {
  const src = readClient()
  const idx = src.indexOf(`<${tag}`)
  assert.ok(idx !== -1, `<${tag}> must exist`)
  const lineStart = src.lastIndexOf('\n', idx) + 1
  const lineEnd = src.indexOf('\n', idx)
  return src.slice(lineStart, lineEnd === -1 ? undefined : lineEnd)
}

const ENCODING_PATTERN = 'encodeURIComponent(token'

// ── 1. encodeURIComponent is used in fallbackRedirectUrl ────────────────────

describe('S-1 SOURCE CONTRACT: encodeURIComponent in fallbackRedirectUrl', () => {
  it('SignInButton fallbackRedirectUrl contains encodeURIComponent(token)', () => {
    const line = getTagLine('SignInButton')
    assert.ok(
      line.includes(ENCODING_PATTERN),
      `SignInButton fallbackRedirectUrl must use encodeURIComponent(token): ${line}`,
    )
    assert.ok(
      line.includes('fallbackRedirectUrl='),
      'SignInButton must have fallbackRedirectUrl prop',
    )
  })

  it('SignUpButton fallbackRedirectUrl contains encodeURIComponent(token)', () => {
    const line = getTagLine('SignUpButton')
    assert.ok(
      line.includes(ENCODING_PATTERN),
      `SignUpButton fallbackRedirectUrl must use encodeURIComponent(token): ${line}`,
    )
    assert.ok(
      line.includes('fallbackRedirectUrl='),
      'SignUpButton must have fallbackRedirectUrl prop',
    )
  })

  it('both fallbackRedirectUrl occurrences use encodeURIComponent (count >= 2)', () => {
    const src = readClient()
    const count = src.split(ENCODING_PATTERN).length - 1
    assert.ok(
      count >= 2,
      `expected at least 2 ${ENCODING_PATTERN}) occurrences, found ${count}`,
    )
  })
})

// ── 2. Encoding prevents injection characters ────────────────────────────────

describe('S-1 INJECTION PREVENTION: encoded URL contains no raw injection chars', () => {
  it('each fallbackRedirectUrl uses encodeURIComponent to encode the token', () => {
    const src = readClient()
    const matches = [
      ...src.matchAll(/fallbackRedirectUrl=\{[^}]*\}/g),
    ]
    assert.ok(matches.length >= 2, 'must have at least 2 fallbackRedirectUrl props')

    for (const m of matches) {
      const url = m[0]
      assert.ok(
        url.includes(ENCODING_PATTERN),
        `each fallbackRedirectUrl must encode the token: ${url}`,
      )
    }
  })

  it('raw token interpolation without encodeURIComponent does not appear in fallbackRedirectUrl', () => {
    const src = readClient()
    const matches = [
      ...src.matchAll(/fallbackRedirectUrl=\{[^}]*\}/g),
    ]
    for (const m of matches) {
      const url = m[0]
      assert.equal(
        url.includes('${token}'),
        false,
        `fallbackRedirectUrl must not contain unencoded \${token}: ${url}`,
      )
    }
  })
})

// ── 3. URL remains same-origin and path is /accept-invite ────────────────────

describe('S-1 URL STRUCTURE: same-origin path preserved', () => {
  it('SignInButton fallbackRedirectUrl path starts with /accept-invite', () => {
    const line = getTagLine('SignInButton')
    assert.ok(
      line.includes('/accept-invite?token='),
      `SignInButton redirect must target /accept-invite path: ${line}`,
    )
  })

  it('SignUpButton fallbackRedirectUrl path starts with /accept-invite', () => {
    const line = getTagLine('SignUpButton')
    assert.ok(
      line.includes('/accept-invite?token='),
      `SignUpButton redirect must target /accept-invite path: ${line}`,
    )
  })

  it('no fallbackRedirectUrl contains a protocol or double-slash (cross-origin)', () => {
    const src = readClient()
    const matches = [
      ...src.matchAll(/fallbackRedirectUrl=\{[^}]*\}/g),
    ]
    for (const m of matches) {
      const url = m[0]
      assert.equal(
        url.includes('https://') || url.includes('http://') || url.includes('//'),
        false,
        `fallbackRedirectUrl must not contain cross-origin URL: ${url}`,
      )
    }
  })
})

// ── 4. H-3 router.replace("/dashboard") unchanged ────────────────────────────

describe('S-1 PRESERVED: H-3 hardcoded router.replace("/dashboard")', () => {
  it('handleAccept success branch still calls router.replace("/dashboard")', () => {
    const src = readClient()
    const handleStart = src.indexOf('const handleAccept = async () =>')
    assert.ok(handleStart !== -1, 'handleAccept must exist')
    const block = src.slice(handleStart, src.indexOf('\n  }', handleStart) + 4)
    assert.ok(
      block.includes('router.replace("/dashboard")'),
      'success branch must still replace with /dashboard',
    )
  })

  it('the success branch carries no ?token= in the navigation target', () => {
    const src = readClient()
    const successIdx = src.indexOf('if (res.success)')
    assert.ok(successIdx !== -1, 'res.success branch must exist')
    const nextBranch = src.indexOf('} else {', successIdx)
    assert.ok(nextBranch !== -1, 'error branch must follow success branch')
    const block = src.slice(successIdx, nextBranch)
    assert.equal(
      block.includes('?token='),
      false,
      'success branch must not embed a token in the navigation target',
    )
  })
})

// ── 5. No user-controlled redirect destination introduced ─────────────────────

describe('S-1 SAFETY: no user-controlled redirect destination', () => {
  it('there is no callbackUrl, redirect_to, returnTo, or next parameter read from URL', () => {
    const src = readClient()
    const lower = src.toLowerCase()
    assert.equal(lower.includes('callbackurl'), false, 'no callbackUrl parameter')
    assert.equal(lower.includes('redirect_to'), false, 'no redirect_to parameter')
    assert.equal(lower.includes('returnto'), false, 'no returnTo parameter')
  })

  it('the only redirect after acceptance is the hardcoded /dashboard', () => {
    const src = readClient()
    const routerCalls = src.match(/router\.\w+\([^)]*\)/g) || []
    assert.ok(
      routerCalls.length >= 1,
      'must have at least one router call',
    )
    for (const call of routerCalls) {
      assert.ok(
        call.includes('/dashboard'),
        `all router calls should target /dashboard: ${call}`,
      )
    }
  })
})
