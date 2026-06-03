'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, Menu, CreateMenuInput } from '@/features/menus/types';
import { createMenuSchema } from '@/features/menus/validations/create-menu-schema';
import { getOrganizationId } from '@/features/menus/actions/_helpers';

export async function createMenu(data: CreateMenuInput): Promise<ActionResponse<Menu>> {
  try {
    createMenuSchema.parse(data);
    const organizationId = await getOrganizationId();

    const menu = await prisma.menu.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        category: data.category,
        pricePerPerson: data.pricePerPerson,
        minPersons: data.minPersons ?? 1,
        maxPersons: data.maxPersons,
        isActive: data.isActive ?? true,
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

    return {
      success: true,
      data: { ...menu, pricePerPerson: Number(menu.pricePerPerson) },
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur lors de la création du menu' };
  }
}
