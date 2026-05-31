'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { ActionResponse, Menu, CreateMenuInput } from '@/features/menus/types';
import { createMenuSchema } from '@/features/menus/validations/create-menu-schema';

export async function createMenu(data: CreateMenuInput): Promise<ActionResponse<Menu>> {
  try {
    // Validate input (optional, server side)
    createMenuSchema.parse(data);

    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const userOrg = await prisma.userOrganization.findFirst({
      where: { user: { clerkId: userId } },
      select: { organizationId: true },
    });
    if (!userOrg) throw new Error('Organization not found');

    const organizationId = userOrg.organizationId;

    const menu = await prisma.menu.create({
      data: {
        organizationId,
        name: data.name,
        category: data.category,
        pricePerPerson: data.pricePerPerson,
        minPersons: data.minPersons ?? 1,
        isActive: data.isActive ?? true,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        category: true,
        pricePerPerson: true,
        minPersons: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const result: Menu = {
      ...menu,
      pricePerPerson: Number(menu.pricePerPerson),
    };
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}