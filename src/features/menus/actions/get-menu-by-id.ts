'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { ActionResponse, Menu } from '@/features/menus/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { MENU } from '@/lib/notify/messages';

const getMenuByIdSchema = z.object({
  id: z.string().min(1),
});

export async function getMenuById(id: string): Promise<ActionResponse<Menu>> {
  try {
    getMenuByIdSchema.parse({ id });
    const organizationId = await getOrganizationId();
    await assertCan('menus', 'read');
    const menu = await prisma.menu.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        organizationId: true,
        name: true,
        description: true,
        category: true,
        pricePerPerson: true,
        minPersons: true,
        maxPersons: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        menuItems: {
          select: {
            id: true,
            menuItemId: true,
            defaultQty: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                category: true,
                unitPrice: true,
                unit: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });
    if (!menu) throw new Error(MENU.NOT_FOUND);
    return {
      success: true,
      data: {
        ...menu,
        pricePerPerson: Number(menu.pricePerPerson),
        menuItems: menu.menuItems?.map((mi: any) => ({
          ...mi,
          menuItem: {
            ...mi.menuItem,
            unitPrice: Number(mi.menuItem.unitPrice),
          },
        })),
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message || MENU.UNEXPECTED_ERROR };
  }
}
