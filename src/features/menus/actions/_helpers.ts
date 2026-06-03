import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function getOrganizationId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const userOrg = await prisma.userOrganization.findFirst({
    where: { user: { clerkId: userId } },
    select: { organizationId: true },
  });
  if (!userOrg) throw new Error('Organization not found');
  return userOrg.organizationId;
}
