'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, MenuItem } from '@/features/menu-items/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';

export async function getMenuItemById(id: string): Promise<ActionResponse<MenuItem>> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('menu-items', 'read');
    const item = await prisma.menuItem.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        organizationId: true,
        name: true,
        category: true,
        unitPrice: true,
        unit: true,
        isActive: true,
        notes: true,
            imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!item) throw new Error('Article non trouvé');
    return { success: true, data: { ...item, unitPrice: Number(item.unitPrice) } };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur lors de la récupération' };
  }
}