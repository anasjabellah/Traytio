'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, MenuItem, CreateMenuItemInput } from '@/features/menu-items/types';
import { createMenuItemSchema } from '@/features/menu-items/validations/create-menu-item-schema';
import { getOrganizationId } from '@/lib/get-organization-id';

export async function createMenuItem(
  data: CreateMenuItemInput,
): Promise<ActionResponse<MenuItem>> {
  try {
    const parsed = createMenuItemSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid data' };
    }
    const validData = parsed.data;
    const organizationId = await getOrganizationId();

    const item = await prisma.menuItem.create({
      data: {
        organizationId,
        name: validData.name,
        category: validData.category,
        unitPrice: validData.unitPrice,
        unit: validData.unit,
        isActive: validData.isActive ?? true,
        notes: validData.notes,
        imageUrl: validData.imageUrl
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