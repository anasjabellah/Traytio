/**
 * B-09 Invitation token exposure — getTeam must not serialize the raw token — Unit Tests
 *
 * Root cause: the active-invitation findMany in `get-team.ts` fetched every
 * column (including the plaintext bearer `Invitation.token`) and the
 * `serializedInvitations` map echoed it to OWNER/ADMIN through the RSC payload
 * and the React Query cache — even though no UI consumer reads it.
 *
 * Fix (defense-in-depth, least privilege):
 *   1. get-team.ts active invitation query selects ONLY {id,email,role,createdAt,expiresAt}
 *   2. serializedInvitations contains exactly those fields — no `token` key
 *   3. TeamInvitation type drops `token: string`
 *
 * Verified here via SOURCE WIRING (read the real production files so a sloppy
 * replica cannot fake the result) plus a faithful serialization-shape replica.
 *
 * Same convention as tests/b01..b08: no @clerk / @prisma imports.
 *
 * Run: npx tsx tests/b09-invitation-token-exposure.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ── 1. SOURCE WIRING ─────────────────────────────────────────────────────────

const SRC_ROOT = resolve(process.cwd(), 'src')

const GET_TEAM_PATH = resolve(SRC_ROOT, 'features/team/actions/get-team.ts')
const TEAM_TYPES_PATH = resolve(SRC_ROOT, 'features/team/types/index.ts')

const SAFE_FIELDS = ['id', 'email', 'role', 'createdAt', 'expiresAt']
const UNSAFE_FIELDS = ['token', 'organizationId']
const EXTRA_SERIALIZED_KEYS = ['userId', 'organizationName']

const TEAM_UI_CONSUMERS = [
  'app/dashboard/settings/team/team-page-client.tsx',
  'features/team/hooks/use-team.ts',
]

// Extract the balanced { ... } argument block of the n-th prisma.invitation.findMany( call.
function findInvitationCall(source: string, ordinal: number): string {
  const opener = 'prisma.invitation.findMany('
  let idx = -1
  for (let n = 0; n < ordinal; n++) {
    idx = source.indexOf(opener, idx + 1)
    if (idx === -1) throw new Error(`invitation.findMany occurrence #${ordinal} not found`)
  }
  const argStart = source.indexOf('{', idx)
  let depth = 0
  for (let i = argStart; i < source.length; i++) {
    const ch = source[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return source.slice(idx, i + 1)
    }
  }
  throw new Error(`unbalanced invitation.findMany call for occurrence #${ordinal}`)
}

// Pull the first `select: { ... }` block out of a call, if present.
function extractSelect(call: string): string | null {
  const m = call.match(/select:\s*\{[\s\S]*?\}/)
  return m ? m[0] : null
}

describe('B-09 SOURCE WIRING: getTeam never reads nor serializes the invitation token', () => {
  it('active invitation findMany uses an explicit select listing ONLY the safe fields', () => {
    const source = readFileSync(GET_TEAM_PATH, 'utf8')
    const active = findInvitationCall(source, 1)
    assert.ok(active.includes('orderBy: { createdAt: "desc" }'), 'active query must sort pending invites newest-first')

    const select = extractSelect(active)
    assert.ok(select, 'active invitation findMany must carry an explicit select')
    for (const field of SAFE_FIELDS) {
      assert.ok(select.includes(`${field}: true`), `select must include ${field}: true`)
    }
    for (const field of UNSAFE_FIELDS) {
      assert.equal(select.includes(`${field}:`), false, `select must NOT include ${field}`)
    }
    const blockFields = (select.replace(/select:|\{|\}|[,\s]/g, '').match(/\w+:true/g) ?? [])
      .map((s) => s.replace(':true', ''))
    assert.deepEqual(
      blockFields.sort(),
      [...SAFE_FIELDS].sort(),
      `select must declare exactly the safe fields, got ${blockFields.join(', ')}`,
    )
  })

  it('historical invitation query keeps its narrow select (createdAt only)', () => {
    const source = readFileSync(GET_TEAM_PATH, 'utf8')
    const historical = findInvitationCall(source, 2)
    assert.ok(historical.includes('gte: historicalStart'), 'historical query must filter on the 8-month window')
    assert.equal(historical.includes('token'), false, 'historical query must not reference token')

    const select = extractSelect(historical)
    assert.ok(select, 'historical query must carry a select')
    assert.match(select, /select:\s*\{\s*createdAt: true\s*\}?/, 'historical select must be createdAt only')
  })

  it('serializedInvitations contains exactly the five safe fields and NO token', () => {
    const source = readFileSync(GET_TEAM_PATH, 'utf8')
    const match = source.match(/const serializedInvitations = invitations\.map\(\(inv\) => \(\{[\s\S]*?\}\)\)/)
    assert.ok(match, 'serializedInvitations map not found')

    const block = match[0]
    assert.equal(block.includes('token'), false, 'serializedInvitations must not contain a token field')

    for (const field of SAFE_FIELDS) {
      assert.ok(block.includes(`inv.${field}`), `serializedInvitations must carry inv.${field}`)
    }
    for (const extra of EXTRA_SERIALIZED_KEYS) {
      assert.equal(block.includes(extra), false, `serializedInvitations must not carry an extra ${extra} field`)
    }
  })

  it('TeamInvitation type no longer declares token', () => {
    const source = readFileSync(TEAM_TYPES_PATH, 'utf8')
    const typeMatch = source.match(/export type TeamInvitation = \{[\s\S]*?\};/)
    assert.ok(typeMatch, 'TeamInvitation type not found')
    assert.equal(typeMatch[0].includes('token'), false, 'TeamInvitation must not declare token')
    for (const field of SAFE_FIELDS) {
      assert.ok(typeMatch[0].includes(field), `TeamInvitation must keep field ${field}`)
    }
  })

  it('no production source still reads inv.token or invitation.token', () => {
    const files = [
      GET_TEAM_PATH,
      TEAM_TYPES_PATH,
      resolve(SRC_ROOT, 'features/team/hooks/use-team.ts'),
      resolve(SRC_ROOT, 'app/dashboard/settings/team/page.tsx'),
      resolve(SRC_ROOT, 'app/dashboard/settings/team/team-page-client.tsx'),
    ]
    for (const path of files) {
      const source = readFileSync(path, 'utf8')
      assert.equal(
        /(?:\.|\[['"])(inv|invitation)\.token/.test(source),
        false,
        `${path} must not read a token from an invitation object`,
      )
    }
  })
})

// ── 2. UI CONSUMERS ──────────────────────────────────────────────────────────

describe('B-09 UI CONSUMERS: no invitation UI reads inv.token', () => {
  for (const rel of TEAM_UI_CONSUMERS) {
    it(`${rel} does not reference inv.token / invitation.token`, () => {
      const source = readFileSync(resolve(SRC_ROOT, rel), 'utf8')
      assert.equal(
        /(?:\.|\[['"])(inv|invitation)\.token/.test(source),
        false,
        `${rel} must not read a token from an invitation object`,
      )
      assert.ok(
        source.includes('invitations'),
        `${rel} must still consume the invitations list`,
      )
    })
  }
})

// ── 3. BEHAVIOR — serialization-shape replica ────────────────────────────────

type SafeInvitation = {
  id: string
  email: string
  role: string
  createdAt: string
  expiresAt: string
}

interface InvitationRow extends SafeInvitation {
  token: string
  organizationId: string
}

describe('B-09 BEHAVIOR: serialization shape carries only safe fields', () => {
  const row: InvitationRow = {
    id: 'inv_test',
    email: 'invitee@example.com',
    role: 'MEMBER',
    createdAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-01-08T00:00:00.000Z',
    token: 'f7b3abc0-0f44-4b0e-9c3f-3f1e9c3f2f0e',
    organizationId: 'org_a',
  }

  const serialize = (inv: InvitationRow): SafeInvitation => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
  })

  it('serialized output has exactly the five safe keys and excludes token', () => {
    const out = serialize(row)
    assert.deepEqual(Object.keys(out).sort(), [...SAFE_FIELDS].sort())
    assert.equal('token' in out, false)
    assert.equal('organizationId' in out, false)
    assert.equal(out.email, 'invitee@example.com')
    assert.equal(out.role, 'MEMBER')
  })
})