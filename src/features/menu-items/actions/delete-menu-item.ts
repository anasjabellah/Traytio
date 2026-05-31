'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/menu-items/types';
import { getOrganizationId } from '@/features/menu-items/actions/_helpers';

export async function deleteMenuItem(id: string): Promise<ActionResponse> {
  try {
    const organizationId = await getOrganizationId();
    await prisma.menuItem.delete({ where: { id, organizationId } });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur lors de la suppression' };
  }
}