'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, Menu, UpdateMenuInput } from '@/features/menus/types';
import { updateMenuSchema } from '@/features/menus/validations/update-menu-schema';
import { getOrganizationId } from '@/lib/get-organization-id';

export async function updateMenu(data: UpdateMenuInput): Promise<ActionResponse<Menu>> {
  try {
    const parsed = updateMenuSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid data' };
    }
    const validData = parsed.data;
    const organizationId = await getOrganizationId();
    const { id, menuItems, ...rest } = validData;

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
