'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/menus/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { MENU } from '@/lib/notify/messages';
import { normalizeActionError } from '@/lib/action-error';

const deleteMenuSchema = z.object({
  id: z.string().min(1),
});

async function deleteMenuHandler(id: string): Promise<ActionResponse> {
  try {
    const parsed = deleteMenuSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? MENU.UNEXPECTED_ERROR };
    }

    const organizationId = await getOrganizationId();
    await assertCan('menus', 'delete');

    // ── Pre-delete guard: block if Menu has linked dependencies ──
    const menuItemLinkCount = await prisma.menuMenuItem.count({
      where: { menuId: id },
    });
    const commandeItemCount = await prisma.commandeItem.count({
      where: { menuId: id },
    });
    if (menuItemLinkCount > 0 || commandeItemCount > 0) {
      return { success: false, error: MENU.DELETE.HAS_DEPENDENCIES };
    }

    await prisma.menu.delete({ where: { id, organizationId } });
    revalidatePath("/dashboard/menus")
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: normalizeActionError(e, MENU.DELETE.ERROR) };
  }
}

export const deleteMenu = withActionGuard(deleteMenuHandler, { name: 'menus:delete' })
