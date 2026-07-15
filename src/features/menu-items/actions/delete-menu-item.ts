'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/menu-items/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { MENU_ITEM } from '@/lib/notify/messages';

const deleteMenuItemSchema = z.object({
  id: z.string().min(1),
});

async function deleteMenuItemHandler(id: string): Promise<ActionResponse> {
  try {
    const parsed = deleteMenuItemSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? MENU_ITEM.UNEXPECTED_ERROR };
    }

    const organizationId = await getOrganizationId();
    await assertCan('menu-items', 'delete');
    await prisma.menuItem.delete({ where: { id, organizationId } });
    revalidatePath("/dashboard/menu-items")
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || MENU_ITEM.DELETE.ERROR };
  }
}

export const deleteMenuItem = withActionGuard(deleteMenuItemHandler, { name: 'menu-items:delete' })