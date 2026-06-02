'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, MenuItem, CreateMenuItemInput } from '@/features/menu-items/types';
import { createMenuItemSchema } from '@/features/menu-items/validations/create-menu-item-schema';
import { getOrganizationId } from '@/features/menu-items/actions/_helpers';

export async function createMenuItem(
  data: CreateMenuItemInput,
): Promise<ActionResponse<MenuItem>> {
  try {
    // Validate payload
    createMenuItemSchema.parse(data);
    const organizationId = await getOrganizationId();

    const item = await prisma.menuItem.create({
      data: {
        organizationId,
        name: data.name,
        category: data.category,
        unitPrice: data.unitPrice,
        unit: data.unit,
        isActive: data.isActive ?? true,
        notes: data.notes,
        imageUrl: data.imageUrl
      },
      select: {
        imageUrl: true,
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
      },
    });

    return {
      success: true,
      data: { ...item, unitPrice: Number(item.unitPrice) },
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur lors de la création' };
  }
}