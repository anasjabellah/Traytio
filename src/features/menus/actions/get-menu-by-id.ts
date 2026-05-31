'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { ActionResponse, Menu } from '@/features/menus/types';

async function getOrganizationId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const userOrg = await prisma.userOrganization.findFirst({
    where: { user: { clerkId: userId } },
    select: { organizationId: true },
  });
  if (!userOrg) throw new Error('Organization not found');
  return userOrg.organizationId;
}

export async function getMenuById(id: string): Promise<ActionResponse<Menu>> {
  try {
    const organizationId = await getOrganizationId();
    const menu = await prisma.menu.findUnique({
      where: { id, organizationId },
    });
    if (!menu) return { success: false, error: 'Menu not found' };
    const result: Menu = {
      id: menu.id,
      organizationId: menu.organizationId,
      name: menu.name,
      category: menu.category,
      pricePerPerson: Number(menu.pricePerPerson),
      minPersons: menu.minPersons,
      isActive: menu.isActive,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
    };
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}