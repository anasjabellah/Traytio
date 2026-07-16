'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { ActionResponse, Menu } from '@/features/menus/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { MENU } from '@/lib/notify/messages';
import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';

const getMenuByIdSchema = z.object({
  id: z.string().min(1),
});

async function getMenuByIdHandler(id: string): Promise<ActionResponse<Menu>> {
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
    if (!menu) return { success: false, error: MENU.NOT_FOUND };
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
  } catch (e: unknown) {
    return { success: false, error: normalizeActionError(e, MENU.UNEXPECTED_ERROR) };
  }
}

export const getMenuById = withActionGuard(getMenuByIdHandler, { name: 'menus:read' })
