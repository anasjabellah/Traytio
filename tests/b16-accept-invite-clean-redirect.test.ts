/**
 * B-16 H-3: after successful acceptance, navigate away from the
 * token-bearing /accept-invite?token=... URL via router.replace("/dashboard").
 *
 * Source-contract test: reads the real client component so a replica cannot
 * fake the result.  Follows the same convention as b09.
 *
 * Run: npx tsx tests/b16-accept-invite-clean-redirect.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

const BT = '`'

const CLIENT_PATH = resolve(
  SRC_ROOT,
  'app/accept-invite/accept-invite-client.tsx',
)

function readClient(): string {
  return readFileSync(CLIENT_PATH, 'utf8')
}

// ── 1. useRouter is wired correctly ──────────────────────────────────────────

describe('B-16 SOURCE WIRING: useRouter from next/navigation', () => {
  it('useRouter is imported from next/navigation alongside useSearchParams', () => {
    const src = readClient()
    const importLine = src
      .split('\n')
      .find((l) => l.includes('useSearchParams') && l.includes('from'))
    assert.ok(importLine, 'must import useSearchParams from a module')
    assert.ok(
      importLine.includes('useRouter'),
      'useRouter must be imported alongside useSearchParams',
    )
    assert.ok(
      importLine.includes('next/navigation'),
      'both hooks must come from next/navigation',
    )
  })

  it('const router = useRouter() is declared inside AcceptInviteContent', () => {
    const src = readClient()
    const contentStart = src.indexOf('function AcceptInviteContent()')
    assert.ok(contentStart !== -1, 'AcceptInviteContent must exist')
    const body = src.slice(contentStart)
    assert.ok(
      body.includes('const router = useRouter()'),
      'AcceptInviteContent must call useRouter()',
    )
  })
})

// ── 2. Success path navigates away ───────────────────────────────────────────

describe('B-16 BEHAVIOR: successful acceptance navigates to /dashboard', () => {
  it('handleAccept success branch calls router.replace("/dashboard")', () => {
    const src = readClient()
    const handleStart = src.indexOf('const handleAccept = async () =>')
    assert.ok(handleStart !== -1, 'handleAccept must exist')
    const block = src.slice(handleStart, src.indexOf('\n  }', handleStart) + 4)
    assert.ok(
      block.includes('router.replace("/dashboard")'),
      'success branch must replace with /dashboard',
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

  it('there is no remaining in-place success UI branch (accepted state removed)', () => {
    const src = readClient()
    assert.equal(
      src.includes('if (accepted)'),
      false,
      'accepted state branch must be removed — user is always navigated away',
    )
  })
})

// ── 3. Unchanged scope preserved ─────────────────────────────────────────────

describe('B-16 UNCHANGED SCOPE: sign-in/sign-up round-trip and error handling', () => {
  it('SignInButton fallbackRedirectUrl still re-embeds the token (pre-accept round-trip)', () => {
    const src = readClient()
    assert.ok(
      src.includes('fallbackRedirectUrl={' + BT + '/accept-invite?token=${token}' + BT + '}'),
      'pre-accept round-trip via Clerk sign-in must remain intact',
    )
  })

  it('error handling still shows AUTH.ACCEPT.ERROR on failure', () => {
    const src = readClient()
    assert.ok(
      src.includes('setError(res.error ?? AUTH.ACCEPT.ERROR)'),
      'error path must remain unchanged',
    )
  })

  it('loading state and accepting flag are still managed', () => {
    const src = readClient()
    assert.ok(src.includes('setAccepting(true)'), 'must still set accepting')
    assert.ok(src.includes('setAccepting(false)'), 'must still clear accepting')
  })
})
