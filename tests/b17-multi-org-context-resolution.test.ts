/**
 * B-17 Multi-organization context resolution — regression test (H-4)
 *
 * H-4 (read-only auth audit) found NO security vulnerability in the absence of
 * an organization switcher: the active organization is derived server-side
 * only and, for users with several memberships, resolves deterministically to
 * the highest legitimate role (SUPERADMIN > OWNER > ADMIN > MEMBER) with the
 * most-recent `createdAt` as the tie-break (src/lib/assert-role.ts).
 *
 * This suite REGRESSION-PINS that resolution by executing the REAL production
 * function (`getCurrentMembership` / `assertCan`) with only its two boundary
 * dependencies stubbed — the Clerk `auth()` session and the Prisma client.
 * Nothing inside the resolution logic is reimplemented here:
 *   - Behavior expectations are SPEC outcomes (which org must win), not a
 *     copied ROLE_RANK map or comparator.
 *   - The ROLE_RANK ordering itself is pinned as a source literal read from
 *     the production file (wiring contract, same style as b08/b14/b15).
 *
 * Mock boundary: this project runs its tests through tsx as CommonJS (no
 * `"type": "module"`), so loader hooks are not consulted for the production
 * module's internal `require()` calls. Instead the two exact specifiers are
 * intercepted at the CJS `Module._load` boundary — BEFORE they reach tsx's
 * resolver — and answered with the controlled stubs below. No other module is
 * mocked and no production source is modified.
 *
 * Run: npx tsx tests/b17-multi-org-context-resolution.test.ts
 */

import { describe, it, beforeEach, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import Module from 'node:module'

const SRC_ROOT = resolve(process.cwd(), 'src')

const REAL_ASSERT_ROLE_URL = pathToFileURL(resolve(SRC_ROOT, 'lib', 'assert-role.ts')).href

type OrgRole = 'SUPERADMIN' | 'OWNER' | 'ADMIN' | 'MEMBER'

type Membership = {
  organizationId: string
  role: OrgRole
  userId: string
}

type MembershipRow = Membership & { createdAt: Date }

type AssertRoleModule = {
  getCurrentMembership: (organizationId?: string) => Promise<Membership>
  assertCan: (module: string, action: string, ownerId?: string) => Promise<OrgRole>
}

type MembershipsDb = {
  userOrganization: {
    findMany: (args: unknown) => Promise<MembershipRow[]>
    findFirst: (args: unknown) => Promise<MembershipRow | null>
  }
}

const PrismaStubModule: { prisma: MembershipsDb } = {
  prisma: {
    userOrganization: {
      findMany: async () => [],
      findFirst: async () => null,
    },
  },
}

const ClerkStubModule = {
  auth: async () => ({
    userId: liveAuthState.userId,
    orgId: liveAuthState.orgId,
  }),
}

// The test sets this per scenario; `auth()` reads it live so the real branch
// conditions in getCurrentMembership (`!clerkId`, `clerkOrgId`) behave as in
// production.
const liveAuthState: { userId?: string | null; orgId?: string | null } = {
  userId: 'user_alice',
  orgId: null,
}

// Intercept the two boundary dependencies of src/lib/assert-role.ts at the CJS
// `require` boundary, before tsx resolves them. This must be installed before
// the production module is imported.
const loadableModule = Module as unknown as {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown
}
const originalLoad = loadableModule._load
loadableModule._load = function (
  this: unknown,
  request: string,
  parent: unknown,
  isMain: boolean,
): unknown {
  if (request === '@/lib/prisma') return PrismaStubModule
  if (request === '@clerk/nextjs/server') return ClerkStubModule
  return originalLoad.call(this, request, parent, isMain)
}

let assertRole: AssertRoleModule

before(async () => {
  assertRole = (await import(REAL_ASSERT_ROLE_URL)) as AssertRoleModule
})

function asMembershipRows(rows: Array<{ organizationId: string; role: OrgRole; createdAt: number }>): MembershipRow[] {
  return rows.map((r) => ({
    organizationId: r.organizationId,
    role: r.role,
    userId: 'user_alice',
    createdAt: new Date(r.createdAt),
  }))
}

// ── 1. Privilege-favoring resolution (real production logic) ────────────────

describe('B-17 BEHAVIOR: privilege-favoring multi-org resolution (real getCurrentMembership)', () => {
  beforeEach(() => {
    liveAuthState.userId = 'user_alice'
    liveAuthState.orgId = null
    PrismaStubModule.prisma.userOrganization.findMany = async () => []
    PrismaStubModule.prisma.userOrganization.findFirst = async () => null
  })

  it('MEMBER in Org A + OWNER in Org B resolves to Org B', async () => {
    PrismaStubModule.prisma.userOrganization.findMany = async () =>
      asMembershipRows([
        { organizationId: 'org_a', role: 'MEMBER', createdAt: 100 },
        { organizationId: 'org_b', role: 'OWNER', createdAt: 200 },
      ])

    const m = await assertRole.getCurrentMembership()

    assert.equal(m.organizationId, 'org_b')
    assert.equal(m.role, 'OWNER')
  })

  it('ADMIN in Org A + OWNER in Org B resolves to Org B', async () => {
    PrismaStubModule.prisma.userOrganization.findMany = async () =>
      asMembershipRows([
        { organizationId: 'org_a', role: 'ADMIN', createdAt: 100 },
        { organizationId: 'org_b', role: 'OWNER', createdAt: 200 },
      ])

    const m = await assertRole.getCurrentMembership()

    assert.equal(m.organizationId, 'org_b')
    assert.equal(m.role, 'OWNER')
  })

  it('OWNER in Org A + SUPERADMIN in Org B resolves to Org B', async () => {
    PrismaStubModule.prisma.userOrganization.findMany = async () =>
      asMembershipRows([
        { organizationId: 'org_a', role: 'OWNER', createdAt: 100 },
        { organizationId: 'org_b', role: 'SUPERADMIN', createdAt: 200 },
      ])

    const m = await assertRole.getCurrentMembership()

    assert.equal(m.organizationId, 'org_b')
    assert.equal(m.role, 'SUPERADMIN')
  })

  it('MEMBER in Org A + ADMIN in Org B resolves to Org B', async () => {
    PrismaStubModule.prisma.userOrganization.findMany = async () =>
      asMembershipRows([
        { organizationId: 'org_a', role: 'MEMBER', createdAt: 100 },
        { organizationId: 'org_b', role: 'ADMIN', createdAt: 200 },
      ])

    const m = await assertRole.getCurrentMembership()

    assert.equal(m.organizationId, 'org_b')
    assert.equal(m.role, 'ADMIN')
  })

  it('a three-way MEMBER/ADMIN/SUPERADMIN set resolves to the SUPERADMIN org', async () => {
    PrismaStubModule.prisma.userOrganization.findMany = async () =>
      asMembershipRows([
        { organizationId: 'org_a', role: 'MEMBER', createdAt: 100 },
        { organizationId: 'org_b', role: 'ADMIN', createdAt: 200 },
        { organizationId: 'org_c', role: 'SUPERADMIN', createdAt: 300 },
      ])

    const m = await assertRole.getCurrentMembership()

    assert.equal(m.organizationId, 'org_c')
    assert.equal(m.role, 'SUPERADMIN')
  })

  it('a single membership resolves to that org (unambiguous, no ranking)', async () => {
    PrismaStubModule.prisma.userOrganization.findMany = async () =>
      asMembershipRows([{ organizationId: 'org_a', role: 'MEMBER', createdAt: 100 }])

    const m = await assertRole.getCurrentMembership()

    assert.equal(m.organizationId, 'org_a')
    assert.equal(m.role, 'MEMBER')
  })

  it('throws Organization not found when the user has no local memberships', async () => {
    await assert.rejects(assertRole.getCurrentMembership(), /Organization not found/)
  })

  it('throws Unauthorized when auth() returns no userId, before any DB access', async () => {
    liveAuthState.userId = undefined
    let reads = 0
    PrismaStubModule.prisma.userOrganization.findMany = async () => {
      reads += 1
      return []
    }

    await assert.rejects(assertRole.getCurrentMembership(), /Unauthorized/)

    assert.equal(reads, 0, 'no membership read happens for an unauthenticated request')
  })
})

// ── 2. Deterministic tie-break (same role, most-recent createdAt) ───────────

describe('B-17 BEHAVIOR: same-role memberships use the most-recent createdAt tie-break deterministically', () => {
  beforeEach(() => {
    liveAuthState.userId = 'user_alice'
    liveAuthState.orgId = null
    PrismaStubModule.prisma.userOrganization.findMany = async () => []
    PrismaStubModule.prisma.userOrganization.findFirst = async () => null
  })

  it('two same-role memberships resolve to the most recently joined org', async () => {
    PrismaStubModule.prisma.userOrganization.findMany = async () =>
      asMembershipRows([
        { organizationId: 'org_a', role: 'MEMBER', createdAt: 100 },
        { organizationId: 'org_b', role: 'MEMBER', createdAt: 300 },
      ])

    const m = await assertRole.getCurrentMembership()

    assert.equal(m.organizationId, 'org_b', 'newer createdAt wins')
    assert.equal(m.role, 'MEMBER')
  })

  it('the tie-break is independent of the DB row order (deterministic resolution)', async () => {
    const olderFirst = asMembershipRows([
      { organizationId: 'org_a', role: 'ADMIN', createdAt: 100 },
      { organizationId: 'org_b', role: 'ADMIN', createdAt: 300 },
    ])
    const newerFirst = asMembershipRows([
      { organizationId: 'org_b', role: 'ADMIN', createdAt: 300 },
      { organizationId: 'org_a', role: 'ADMIN', createdAt: 100 },
    ])

    PrismaStubModule.prisma.userOrganization.findMany = async () => olderFirst
    const m1 = await assertRole.getCurrentMembership()

    PrismaStubModule.prisma.userOrganization.findMany = async () => newerFirst
    const m2 = await assertRole.getCurrentMembership()

    assert.equal(m1.organizationId, 'org_b')
    assert.equal(m2.organizationId, 'org_b')
  })
})

// ── 3. Explicit / Clerk context does not bypass multi-org ranking ──────────

describe('B-17 BEHAVIOR: explicit and Clerk org context is verified before use (real resolution order)', () => {
  beforeEach(() => {
    liveAuthState.userId = 'user_alice'
    liveAuthState.orgId = null
    PrismaStubModule.prisma.userOrganization.findMany = async () => []
    PrismaStubModule.prisma.userOrganization.findFirst = async () => null
  })

  it('an explicit verified orgId takes precedence over ranking (membership is re-verified)', async () => {
    PrismaStubModule.prisma.userOrganization.findMany = async () =>
      asMembershipRows([
        { organizationId: 'org_a', role: 'MEMBER', createdAt: 100 },
        { organizationId: 'org_b', role: 'OWNER', createdAt: 200 },
      ])
    const verifiedAgainst: unknown[] = []
    PrismaStubModule.prisma.userOrganization.findFirst = async (args) => {
      verifiedAgainst.push(args)
      return { organizationId: 'org_a', role: 'MEMBER', userId: 'user_alice', createdAt: new Date(100) }
    }

    const m = await assertRole.getCurrentMembership('org_a')

    assert.equal(m.organizationId, 'org_a', 'verified explicit org wins over the highest-ranked org')
    assert.equal(m.role, 'MEMBER')
    assert.equal(verifiedAgainst.length, 1, 'the explicit org must be checked against real membership')
  })

  it('an explicit orgId the user does not belong to is rejected with Forbidden', async () => {
    PrismaStubModule.prisma.userOrganization.findFirst = async () => null

    await assert.rejects(
      assertRole.getCurrentMembership('org_unknown'),
      /Forbidden: you do not belong to this organization/,
    )
  })

  it('a Clerk active org that maps to no local membership is safely ignored (falls through to ranking)', async () => {
    liveAuthState.orgId = 'org_clerk_unmapped'
    PrismaStubModule.prisma.userOrganization.findFirst = async () => null
    PrismaStubModule.prisma.userOrganization.findMany = async () =>
      asMembershipRows([
        { organizationId: 'org_a', role: 'ADMIN', createdAt: 100 },
        { organizationId: 'org_b', role: 'OWNER', createdAt: 200 },
      ])

    const m = await assertRole.getCurrentMembership()

    assert.equal(m.organizationId, 'org_b', 'unmapped Clerk org must not cause a denial or a wrong org')
    assert.equal(m.role, 'OWNER')
  })
})

// ── 4. Resolved role flows into authorization (real PERMISSIONS matrix) ──────

describe('B-17 BEHAVIOR: the resolved highest-role membership drives assertCan', () => {
  beforeEach(() => {
    liveAuthState.userId = 'user_alice'
    liveAuthState.orgId = null
    PrismaStubModule.prisma.userOrganization.findMany = async () => []
    PrismaStubModule.prisma.userOrganization.findFirst = async () => null
  })

  it('a user who owns Org B (SUPERADMIN tier) passes a superadmin-only gate', async () => {
    PrismaStubModule.prisma.userOrganization.findMany = async () =>
      asMembershipRows([
        { organizationId: 'org_a', role: 'MEMBER', createdAt: 100 },
        { organizationId: 'org_b', role: 'SUPERADMIN', createdAt: 200 },
      ])

    const role = await assertRole.assertCan('superadmin', 'organizations')

    assert.equal(role, 'SUPERADMIN')
  })

  it('a user whose highest legitimate role is OWNER is denied a superadmin-only gate', async () => {
    PrismaStubModule.prisma.userOrganization.findMany = async () =>
      asMembershipRows([
        { organizationId: 'org_a', role: 'MEMBER', createdAt: 100 },
        { organizationId: 'org_b', role: 'OWNER', createdAt: 200 },
      ])

    await assert.rejects(assertRole.assertCan('superadmin', 'organizations'), /OWNER cannot organizations superadmin/)
  })
})

// ── 5. Source contract: assert-role.ts keeps the documented resolution wiring ─

describe('B-17 SOURCE CONTRACT: assert-role.ts keeps the documented resolution wiring', () => {
  const src = readFileSync(resolve(SRC_ROOT, 'lib', 'assert-role.ts'), 'utf8')

  it('ROLE_RANK literal ranks SUPERADMIN > OWNER > ADMIN > MEMBER (4, 3, 2, 1)', () => {
    const rankStart = src.indexOf('const ROLE_RANK')
    assert.ok(rankStart !== -1, 'ROLE_RANK must exist in assert-role.ts')
    const block = src.slice(rankStart, src.indexOf('}', rankStart) + 1)
    const pairs = block.match(/\w+: \d+/g) ?? []
    assert.deepEqual(pairs, ['SUPERADMIN: 4', 'OWNER: 3', 'ADMIN: 2', 'MEMBER: 1'])
  })

  it('ranks by ROLE_RANK and tie-breaks on the most-recent createdAt', () => {
    assert.ok(
      src.includes('ROLE_RANK[b.role] - ROLE_RANK[a.role]'),
      'the comparator must order by ROLE_RANK (descending)',
    )
    assert.ok(
      src.includes('b.createdAt.getTime() - a.createdAt.getTime()'),
      'the tie-break must prefer the most-recent createdAt (b first)',
    )
  })

  it('the single-membership shortcut precedes the ranking path', () => {
    const singleIdx = src.indexOf('memberships.length === 1')
    const rankIdx = src.indexOf('ROLE_RANK[b.role] - ROLE_RANK[a.role]')
    assert.ok(singleIdx !== -1, 'single-membership shortcut must exist')
    assert.ok(rankIdx !== -1, 'ranking comparator must exist')
    assert.ok(rankIdx > singleIdx, 'ranking must run only after the single-membership shortcut')
  })

  it('the ranking path is only reached when no explicit verified context applied', () => {
    assert.ok(src.includes('if (memberships.length === 0)'), 'empty memberships must short-circuit first')
    const multiOrgSort = src.indexOf('const chosen = [...memberships].sort(')
    assert.ok(multiOrgSort !== -1, 'the multi-org selection must sort the fetched memberships')
    const explicitBranch = src.indexOf('Forbidden: you do not belong to this organization')
    assert.ok(explicitBranch !== -1, 'explicit org must be membership-verified (branch 1)')
    assert.ok(multiOrgSort > explicitBranch, 'the explicit-org branch must precede the auto-ranking path')
  })
})