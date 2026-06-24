'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/commandes/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';

export async function deleteCommande(id: string): Promise<ActionResponse<void>> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('commandes', 'delete');

    const commande = await prisma.commande.findFirst({
      where: { id, organizationId },
    });

    if (!commande) {
      return { success: false, error: 'Commande not found or access denied' };
    }

    // Check for invoices linked
    const invoicesCount = await prisma.invoice.count({
      where: { commandeId: id },
    });

    if (invoicesCount > 0) {
      return {
        success: false,
        error: 'Impossible de supprimer cette commande car elle a des factures liées',
      };
    }

    await prisma.commande.delete({
      where: { id },
    });

    revalidatePath("/dashboard/commandes")
    revalidatePath("/dashboard")

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
}
