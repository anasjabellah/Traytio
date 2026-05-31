'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { ActionResponse, Menu, UpdateMenuInput } from '@/features/menus/types';
import { updateMenuSchema } from '@/features/menus/validations/update-menu-schema';

export async function updateMenu(data: UpdateMenuInput): Promise<ActionResponse<Menu>> {
  try {
    // Validate input server-side
    updateMenuSchema.parse(data);

    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const userOrg = await prisma.userOrganization.findFirst({
      where: { user: { clerkId: userId } },
      select: { organizationId: true },
    });
    if (!userOrg) throw new Error('Organization not found');

    const organizationId = userOrg.organizationId;
    const { id, ...updateData } = data;

    const menu = await prisma.menu.update({
      where: { id, organizationId },
      data: {
        ...updateData,
        pricePerPerson: updateData.pricePerPerson !== undefined ? updateData.pricePerPerson : undefined,
        minPersons: updateData.minPersons ?? undefined,
        isActive: updateData.isActive ?? undefined,
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