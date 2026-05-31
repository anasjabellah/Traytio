'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { ActionResponse } from '@/features/menus/types';

async function getOrganizationId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const userOrg = await prisma.userOrganization.findFirst({
    where: { user: { clerkId: userId } },
    select: { organizationId: true },
  });
  if (!userOrg) throw new Error('Organization not found');
  return userOrg.organizationId;
}

export async function deleteMenu(id: string): Promise<ActionResponse> {
  try {
    const organizationId = await getOrganizationId();
    await prisma.menu.delete({
      where: { id, organizationId },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}