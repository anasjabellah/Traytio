import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const getOrganizationId = cache(async (): Promise<string> => {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const result = await prisma.userOrganization.findFirst({
    where: { user: { clerkId: userId } },
    select: { organizationId: true },
  });

  if (!result) throw new Error('Organization not found');
  return result.organizationId;
});
