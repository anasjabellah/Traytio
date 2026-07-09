'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/menu-items/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { MENU_ITEM } from '@/lib/notify/messages';

export async function deleteMenuItem(id: string): Promise<ActionResponse> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('menu-items', 'delete');
    await prisma.menuItem.delete({ where: { id, organizationId } });
    revalidatePath("/dashboard/menu-items")
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || MENU_ITEM.DELETE.ERROR };
  }
}