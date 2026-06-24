'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/menus/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';

export async function deleteMenu(id: string): Promise<ActionResponse> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('menus', 'delete');
    await prisma.menu.delete({ where: { id, organizationId } });
    revalidatePath("/dashboard/menus")
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur lors de la suppression du menu' };
  }
}
