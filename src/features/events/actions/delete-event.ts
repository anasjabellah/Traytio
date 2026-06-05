'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { ActionResponse } from '@/features/events/types';

export async function deleteEvent(id: string): Promise<ActionResponse<void>> {
  try {
    console.time('deleteEvent:total');

    console.time('deleteEvent:auth');
    const { userId } = await auth();
    console.timeEnd('deleteEvent:auth');
    if (!userId) throw new Error('Unauthorized');

    console.time('deleteEvent:orgLookup');
    const userOrg = await prisma.userOrganization.findFirst({
      where: { user: { clerkId: userId } },
      select: { organizationId: true }
    });
    console.timeEnd('deleteEvent:orgLookup');
    if (!userOrg) throw new Error('Organization not found');

    const organizationId = userOrg.organizationId;

    console.time('deleteEvent:delete');
    await prisma.event.delete({
      where: { id, organizationId }
    });
    console.timeEnd('deleteEvent:delete');

    console.timeEnd('deleteEvent:total');
    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}