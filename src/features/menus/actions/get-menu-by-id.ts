'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, Menu } from '@/features/menus/types';
import { getOrganizationId } from '@/features/menus/actions/_helpers';

export async function getMenuById(id: string): Promise<ActionResponse<Menu>> {
  try {
    const organizationId = await getOrganizationId();
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
    if (!menu) throw new Error('Menu non trouvé');
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
    return { success: false, error: e.message || 'Erreur lors de la récupération du menu' };
  }
}
