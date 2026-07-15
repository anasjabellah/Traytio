'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse, MenuItem, UpdateMenuItemInput } from '@/features/menu-items/types';
import { updateMenuItemSchema } from '@/features/menu-items/validations/update-menu-item-schema';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { MENU_ITEM } from '@/lib/notify/messages';
import { withActionGuard } from '@/lib/action-guard';

async function updateMenuItemHandler(
  data: UpdateMenuItemInput,
): Promise<ActionResponse<MenuItem>> {
  try {
    const parsed = updateMenuItemSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || MENU_ITEM.INVALID_INPUT };
    }
    const validData = parsed.data;
    const organizationId = await getOrganizationId();
    await assertCan('menu-items', 'update');
    const { id, ...rest } = validData;

    const item = await prisma.menuItem.update({
      where: { id, organizationId },
      data: {
        name: rest.name,
        category: rest.category,
        unitPrice: rest.unitPrice,
        unit: rest.unit,
        isActive: rest.isActive,
        notes: rest.notes,
        imageUrl: rest.imageUrl
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        category: true,
        unitPrice: true,
        unit: true,
        isActive: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        imageUrl: true,
      },
    });

    revalidatePath("/dashboard/menu-items")

    return {
      success: true,
      data: { ...item, unitPrice: Number(item.unitPrice) },
    };
  } catch (e: any) {
    return { success: false, error: e.message || MENU_ITEM.UPDATE.ERROR };
  }
}

export const updateMenuItem = withActionGuard(updateMenuItemHandler, { name: 'menu-items:update' })