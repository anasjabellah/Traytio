'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/menu-items/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { MENU_ITEM } from '@/lib/notify/messages';
import { normalizeActionError } from '@/lib/action-error';

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

    // ── Pre-delete guard: block if MenuItem has linked dependencies ──
    const menuItemLinkCount = await prisma.menuMenuItem.count({
      where: { menuItemId: id },
    });
    const commandeItemCount = await prisma.commandeItem.count({
      where: { menuItemId: id },
    });
    if (menuItemLinkCount > 0 || commandeItemCount > 0) {
      return { success: false, error: MENU_ITEM.DELETE.HAS_DEPENDENCIES };
    }

    await prisma.menuItem.delete({ where: { id, organizationId } });
    revalidatePath("/dashboard/menu-items")
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: normalizeActionError(e, MENU_ITEM.DELETE.ERROR) };
  }
}

export const deleteMenuItem = withActionGuard(deleteMenuItemHandler, { name: 'menu-items:delete' })
