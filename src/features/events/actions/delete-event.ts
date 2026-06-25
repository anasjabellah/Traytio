'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/events/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';

export async function deleteEvent(id: string): Promise<ActionResponse<void>> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('events', 'delete');

    await prisma.event.delete({
      where: { id, organizationId }
    });

    revalidatePath("/dashboard/events")
    revalidatePath("/dashboard/calendar")

    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}
