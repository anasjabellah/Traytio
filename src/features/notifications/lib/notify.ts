import type { NotificationType, Prisma } from '@prisma/client';

export type OrgNotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
};

// PrismaClient is structurally assignable to TransactionClient (the latter
// only omits connection methods), so this accepts both the root client and
// an interactive-transaction client — same pattern as
// recalculate-commande-balances.ts.
type ClientLike = Prisma.TransactionClient;

/**
 * Fan out a notification to every member of an organization (actor included:
 * the center doubles as a team activity trail and this guarantees the bell
 * lights up even in single-member orgs).
 *
 * Best-effort by design: callers must never fail their business action when
 * fan-out fails — wrap in try/catch at the call site.
 */
export async function notifyOrganizationMembers(
  db: ClientLike,
  organizationId: string,
  input: OrgNotificationInput,
): Promise<number> {
  const memberships = await db.userOrganization.findMany({
    where: { organizationId },
    select: { userId: true },
  });
  const userIds = [...new Set(memberships.map((m) => m.userId))];
  if (userIds.length === 0) return 0;

  await db.notification.createMany({
    data: userIds.map((userId) => ({
      organizationId,
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
    })),
  });
  return userIds.length;
}

export type { ClientLike };
