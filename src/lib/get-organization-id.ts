import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

function getOrgIdCache(): Map<string, string> {
  if (!(globalThis as any).__orgIdCache) {
    (globalThis as any).__orgIdCache = new Map<string, string>();
  }
  return (globalThis as any).__orgIdCache;
}

export async function getOrganizationId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const cache = getOrgIdCache();
  const cached = cache.get(userId);
  if (cached) return cached;

  const result = await prisma.userOrganization.findFirst({
    where: { user: { clerkId: userId } },
    select: { organizationId: true },
  });

  if (!result) throw new Error('Organization not found');
  cache.set(userId, result.organizationId);
  return result.organizationId;
}
