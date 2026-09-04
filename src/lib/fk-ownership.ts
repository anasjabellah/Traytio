type PrismaModelDelegate = {
  findFirst: (args: { where: Record<string, unknown>; select?: Record<string, true> }) => Promise<unknown>
  findMany: (args: { where: Record<string, unknown>; select?: Record<string, true> }) => Promise<unknown[]>
}

/**
 * Verify that a single foreign-key reference belongs to the given organization.
 *
 * @param model  Prisma model delegate (e.g. prisma.client)
 * @param fkValue  The FK ID received from client input
 * @param organizationId  The server-side authenticated organization ID
 * @param modelName  Human-readable model name for the error message (e.g. "client")
 * @returns `null` on success, or `{ success: false, error: string }` on failure
 */
export async function verifySingleFkOwnership(
  model: PrismaModelDelegate,
  fkValue: string | null | undefined,
  organizationId: string,
  modelName: string,
): Promise<{ success: false; error: string } | null> {
  if (!fkValue) return null

  const record = await model.findFirst({
    where: { id: fkValue, organizationId },
    select: { id: true },
  })
  if (!record) {
    return { success: false, error: `Invalid ${modelName} for organization` }
  }
  return null
}

/**
 * Verify that multiple foreign-key references (e.g. an array of menuItemIds)
 * all belong to the given organization.
 *
 * @param model  Prisma model delegate (e.g. prisma.menuItem)
 * @param fkValues  Array of FK IDs received from client input
 * @param organizationId  The server-side authenticated organization ID
 * @param modelName  Human-readable model name for the error message (e.g. "menu item")
 * @returns `null` on success, or `{ success: false, error: string }` on failure
 */
export async function verifyBatchFkOwnership(
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
