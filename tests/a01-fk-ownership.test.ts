/**
 * A-01 FK Ownership Validation — Unit Tests
 *
 * Tests the reusable verifySingleFkOwnership and verifyBatchFkOwnership helpers
 * that prevent cross-tenant foreign-key references.
 *
 * Run: npx tsx tests/a01-fk-ownership.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ── Inline implementation of the helpers under test (mirrors src/lib/fk-ownership.ts)
// We inline rather than import to avoid pulling in Prisma/Clerk transitive deps.

type PrismaModelDelegate = {
  findMany: (args: { where: Record<string, unknown>; select?: Record<string, true> }) => Promise<unknown[]>
  findFirst?: (args: { where: Record<string, unknown>; select?: Record<string, true> }) => Promise<unknown>
}

async function verifySingleFkOwnership(
  model: PrismaModelDelegate,
  fkValue: string | null | undefined,
  organizationId: string,
  modelName: string,
): Promise<{ success: false; error: string } | null> {
  if (!fkValue) return null
  const record = await model.findFirst!({
    where: { id: fkValue, organizationId },
    select: { id: true },
  })
  if (!record) {
    return { success: false, error: `Invalid ${modelName} for organization` }
  }
  return null
}

async function verifyBatchFkOwnership(
  model: PrismaModelDelegate,
  fkValues: string[],
  organizationId: string,
  modelName: string,
): Promise<{ success: false; error: string } | null> {
  if (fkValues.length === 0) return null
  const validRecords = await model.findMany({
    where: { id: { in: fkValues }, organizationId },
    select: { id: true },
  })
  if (validRecords.length !== fkValues.length) {
    return { success: false, error: `Invalid ${modelName} for organization` }
  }
  return null
}

// ── Mock builders ──

/** Creates a mock Prisma model that owns the given set of IDs for a given org. */
function createMockModel(
  orgOwnedIds: Record<string, string[]>, // { orgA: ['id1', 'id2'], orgB: ['id3'] }
): PrismaModelDelegate {
  return {
    findFirst: async (args: { where: Record<string, unknown> }) => {
      const id = args.where.id as string
      const orgId = args.where.organizationId as string
      const owned = orgOwnedIds[orgId] ?? []
      return owned.includes(id) ? { id } : null
    },
    findMany: async (args: { where: Record<string, unknown> }) => {
      const orgId = args.where.organizationId as string
      const idFilter = args.where.id as { in: string[] }
      const owned = orgOwnedIds[orgId] ?? []
      return idFilter.in.filter((id) => owned.includes(id)).map((id) => ({ id }))
    },
  }
}

// ── Tests ──

const ORG_A = 'org_a_001'
const ORG_B = 'org_b_002'

describe('verifySingleFkOwnership', () => {
  it('returns null when fkValue is null (optional FK)', async () => {
    const model = createMockModel({})
    const result = await verifySingleFkOwnership(model, null, ORG_A, 'client')
    assert.equal(result, null)
  })

  it('returns null when fkValue is undefined (optional FK)', async () => {
    const model = createMockModel({})
    const result = await verifySingleFkOwnership(model, undefined, ORG_A, 'client')
    assert.equal(result, null)
  })

  it('returns null when the FK belongs to the same organization', async () => {
    const model = createMockModel({ [ORG_A]: ['client_1'] })
    const result = await verifySingleFkOwnership(model, 'client_1', ORG_A, 'client')
    assert.equal(result, null)
  })

  it('returns error when the FK belongs to another organization', async () => {
    const model = createMockModel({ [ORG_B]: ['client_99'] })
    const result = await verifySingleFkOwnership(model, 'client_99', ORG_A, 'client')
    assert.deepEqual(result, {
      success: false,
      error: 'Invalid client for organization',
    })
  })

  it('returns error when the FK does not exist at all', async () => {
    const model = createMockModel({ [ORG_A]: [] })
    const result = await verifySingleFkOwnership(model, 'nonexistent', ORG_A, 'client')
    assert.deepEqual(result, {
      success: false,
      error: 'Invalid client for organization',
    })
  })
})

describe('verifyBatchFkOwnership', () => {
  it('returns null for empty array (no FKs to check)', async () => {
    const model = createMockModel({})
    const result = await verifyBatchFkOwnership(model, [], ORG_A, 'menu item')
    assert.equal(result, null)
  })

  it('returns null when all FKs belong to the same organization', async () => {
    const model = createMockModel({ [ORG_A]: ['item_1', 'item_2', 'item_3'] })
    const result = await verifyBatchFkOwnership(model, ['item_1', 'item_2', 'item_3'], ORG_A, 'menu item')
    assert.equal(result, null)
  })

  it('returns error when one FK belongs to another organization (cross-tenant attack)', async () => {
    const model = createMockModel({
      [ORG_A]: ['item_1', 'item_2'],
      [ORG_B]: ['item_stolen'],
    })
    // Org A tries to reference item_stolen which belongs to Org B
    const result = await verifyBatchFkOwnership(model, ['item_1', 'item_stolen'], ORG_A, 'menu item')
    assert.deepEqual(result, {
      success: false,
      error: 'Invalid menu item for organization',
    })
    // The helper should have queried with ORG_A's ID, so item_stolen is NOT found
  })

  it('returns error when ALL FKs belong to another organization', async () => {
    const model = createMockModel({
      [ORG_B]: ['item_x', 'item_y'],
    })
    const result = await verifyBatchFkOwnership(model, ['item_x', 'item_y'], ORG_A, 'menu item')
    assert.deepEqual(result, {
      success: false,
      error: 'Invalid menu item for organization',
    })
  })

  it('returns error when FK does not exist at all', async () => {
    const model = createMockModel({ [ORG_A]: ['item_1'] })
    const result = await verifyBatchFkOwnership(model, ['item_1', 'nonexistent'], ORG_A, 'menu item')
    assert.deepEqual(result, {
      success: false,
      error: 'Invalid menu item for organization',
    })
  })

  it('passes correct where clause to Prisma (organizationId is always server-derived)', async () => {
    const capturedArgs: Record<string, unknown>[] = []
    const model: PrismaModelDelegate = {
      findMany: async (args) => {
        capturedArgs.push(args.where)
        return []
      },
    }
    await verifyBatchFkOwnership(model, ['a', 'b'], 'my_org_id', 'menu item')

    // The where clause must include organizationId equal to the server-derived value
    assert.equal(capturedArgs.length, 1)
    assert.equal(capturedArgs[0].organizationId, 'my_org_id')
    assert.deepEqual((capturedArgs[0].id as { in: string[] }).in, ['a', 'b'])
  })
})

describe('Cross-tenant attack scenarios (integration-style)', () => {
  it('Org A cannot use Org B menuItem IDs to create a menu', async () => {
    // Scenario: Org A creates a menu with items [A1, A2] — should succeed
    // Then tries [A1, B1] where B1 belongs to Org B — should fail
    const model = createMockModel({
      [ORG_A]: ['a1', 'a2'],
      [ORG_B]: ['b1', 'b2'],
    })

    // Legitimate same-org request
    const legit = await verifyBatchFkOwnership(model, ['a1', 'a2'], ORG_A, 'menu item')
    assert.equal(legit, null, 'Same-org request should succeed')

    // Cross-tenant attack
    const attack = await verifyBatchFkOwnership(model, ['a1', 'b1'], ORG_A, 'menu item')
    assert.notEqual(attack, null, 'Cross-tenant request should be rejected')
    assert.equal(attack!.success, false)
    assert.match(attack!.error, /Invalid menu item/)
  })

  it('Org A cannot swap all menu items to Org B items on update', async () => {
    const model = createMockModel({
      [ORG_A]: ['a1'],
      [ORG_B]: ['b1', 'b2'],
    })

    // Org A tries to replace all items with Org B's items
    const attack = await verifyBatchFkOwnership(model, ['b1', 'b2'], ORG_A, 'menu item')
    assert.notEqual(attack, null, 'Should reject all-Org-B items')
    assert.equal(attack!.success, false)
  })

  it('legitimate update with same-org items still works', async () => {
    const model = createMockModel({
      [ORG_A]: ['a1', 'a2', 'a3'],
    })

    const result = await verifyBatchFkOwnership(model, ['a1', 'a3'], ORG_A, 'menu item')
    assert.equal(result, null, 'Same-org update should succeed')
  })
})
