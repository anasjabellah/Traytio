'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/events/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { EVENT } from '@/lib/notify/messages';

const deleteEventSchema = z.object({
  id: z.string().min(1),
});

async function deleteEventHandler(id: string): Promise<ActionResponse<void>> {
  try {
    const parsed = deleteEventSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? EVENT.VALIDATION.INVALID_VALUE };
    }

    const organizationId = await getOrganizationId();
    await assertCan('events', 'delete');

    await prisma.event.delete({
      where: { id, organizationId }
    });

    revalidatePath("/dashboard/events")
    revalidatePath("/dashboard/calendar")

    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message || EVENT.UNEXPECTED_ERROR };
  }
}

export const deleteEvent = withActionGuard(deleteEventHandler, { name: 'events:delete' })
