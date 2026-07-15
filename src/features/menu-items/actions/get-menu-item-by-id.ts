'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { ActionResponse, MenuItem } from '@/features/menu-items/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { MENU_ITEM } from '@/lib/notify/messages';

const getMenuItemByIdSchema = z.object({
  id: z.string().min(1),
});

export async function getMenuItemById(id: string): Promise<ActionResponse<MenuItem>> {
  try {
    getMenuItemByIdSchema.parse({ id });
    const organizationId = await getOrganizationId();
    await assertCan('menu-items', 'read');
    const item = await prisma.menuItem.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        organizationId: true,
        name: true,
        category: true,
        unitPrice: true,
        unit: true,
        isActive: true,
        notes: true,
            imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!item) throw new Error(MENU_ITEM.NOT_FOUND);
    return { success: true, data: { ...item, unitPrice: Number(item.unitPrice) } };
  } catch (e: any) {
    return { success: false, error: e.message || MENU_ITEM.UNEXPECTED_ERROR };
  }
}