'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/commandes/types';
import { getOrganizationId } from '@/lib/get-organization-id';

export async function deleteCommande(id: string): Promise<ActionResponse<void>> {
  try {
    const organizationId = await getOrganizationId();

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

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
}
