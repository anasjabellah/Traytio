'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/menus/types';
import { getOrganizationId } from '@/lib/get-organization-id';

export async function deleteMenu(id: string): Promise<ActionResponse> {
  try {
    const organizationId = await getOrganizationId();
    await prisma.menu.delete({ where: { id, organizationId } });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur lors de la suppression du menu' };
  }
}
