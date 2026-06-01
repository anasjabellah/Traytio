'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, MenuItem, UpdateMenuItemInput } from '@/features/menu-items/types';
import { updateMenuItemSchema } from '@/features/menu-items/validations/update-menu-item-schema';
import { getOrganizationId } from '@/features/menu-items/actions/_helpers';

export async function updateMenuItem(
  data: UpdateMenuItemInput,
): Promise<ActionResponse<MenuItem>> {
  try {
    // Validate payload
    updateMenuItemSchema.parse(data);
    const organizationId = await getOrganizationId();
    const { id, ...rest } = data;

    const item = await prisma.menuItem.update({
      where: { id, organizationId },
      data: {
        name: rest.name,
        category: rest.category,
        unitPrice: rest.unitPrice,
        unit: rest.unit,
        isActive: rest.isActive,
        notes: rest.notes,
        imageUrl: rest.imageUrl,
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

    return {
      success: true,
      data: { ...item, unitPrice: Number(item.unitPrice) },
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur lors de la mise à jour' };
  }
}