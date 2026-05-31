'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { ActionResponse } from '@/features/events/types';

export async function deleteEvent(id: string): Promise<ActionResponse<void>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const userOrg = await prisma.userOrganization.findFirst({
      where: { user: { clerkId: userId } },
      select: { organizationId: true }
    });
    if (!userOrg) throw new Error('Organization not found');

    const organizationId = userOrg.organizationId;

    await prisma.event.delete({
      where: { id, organizationId }
    });

    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}