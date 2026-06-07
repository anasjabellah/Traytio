import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const getOrganizationId = cache(async (): Promise<string> => {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  console.log('[getOrganizationId] userId:', userId);

  const userOrg = await prisma.userOrganization.findFirst({
    where: { user: { clerkId: userId } },
    select: { organizationId: true },
  });

  console.log('[getOrganizationId] userOrganization result:', userOrg?.organizationId ?? null);

  if (userOrg) return userOrg.organizationId;

  // Fallback: webhook didn't fire — auto-create User, Organization, and link
  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  console.log('[getOrganizationId] existing user:', user?.id ?? null);

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: `${userId}@placeholder.local`,
        firstName: null,
        lastName: null,
      },
    });
    console.log('[getOrganizationId] created user:', user.id);
  }

  const org = await prisma.organization.create({
    data: {
      name: `${user.firstName || user.email}'s Organisation`,
      slug: `org-${userId.slice(0, 8)}-${Date.now()}`,
      email: user.email,
    },
  });

  await prisma.userOrganization.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: 'OWNER',
    },
  });

  console.log('[getOrganizationId] created org:', org.id, 'for user:', user.id);
  return org.id;
});
