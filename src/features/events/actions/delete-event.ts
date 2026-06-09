'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/events/types';
import { getOrganizationId } from '@/lib/get-organization-id';

export async function deleteEvent(id: string): Promise<ActionResponse<void>> {
  try {
    const organizationId = await getOrganizationId();

    await prisma.event.delete({
      where: { id, organizationId }
    });

    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}
