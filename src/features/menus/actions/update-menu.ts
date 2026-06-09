'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, Menu, UpdateMenuInput } from '@/features/menus/types';
import { updateMenuSchema } from '@/features/menus/validations/update-menu-schema';
import { getOrganizationId } from '@/features/menus/actions/_helpers';

export async function updateMenu(data: UpdateMenuInput): Promise<ActionResponse<Menu>> {
  try {
    updateMenuSchema.parse(data);
    const organizationId = await getOrganizationId();
    const { id, menuItems, ...rest } = data;

    const menu = await prisma.$transaction(async (tx) => {
      const updated = await tx.menu.update({
        where: { id, organizationId },
        data: {
          name: rest.name,
          description: rest.description,
          category: rest.category,
          pricePerPerson: rest.pricePerPerson,
          minPersons: rest.minPersons,
          maxPersons: rest.maxPersons,
          isActive: rest.isActive,
        },
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
        },
      });

      await tx.menuMenuItem.deleteMany({ where: { menuId: id } });
      if (menuItems && menuItems.length > 0) {
        await tx.menuMenuItem.createMany({
          data: menuItems.map(item => ({
            menuId: id,
            menuItemId: item.menuItemId,
            defaultQty: item.defaultQty,
          })),
        });
      }

      return updated;
    });

    return {
      success: true,
      data: { ...menu, pricePerPerson: Number(menu.pricePerPerson) },
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur lors de la mise à jour du menu' };
  }
}
