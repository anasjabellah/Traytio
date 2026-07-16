'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/commandes/types';
import { getOrganizationId } from '@/lib/get-organization-id';
import { COMMANDE } from '@/lib/notify/messages';
import { assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';

const deleteCommandeSchema = z.object({
  id: z.string().min(1),
});

async function deleteCommandeHandler(id: string): Promise<ActionResponse<void>> {
  try {
    const parsed = deleteCommandeSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? COMMANDE.VALIDATION.INVALID_DATA };
    }

    const organizationId = await getOrganizationId();
    await assertCan('commandes', 'delete');

    const commande = await prisma.commande.findFirst({
      where: { id, organizationId },
    });

    if (!commande) {
      return { success: false, error: COMMANDE.NOT_FOUND_OR_ACCESS_DENIED };
    }

    // Check for invoices linked
    const invoicesCount = await prisma.invoice.count({
      where: { commandeId: id },
    });

    if (invoicesCount > 0) {
      return {
        success: false,
        error: COMMANDE.DELETE.ERROR_INVOICES,
      };
    }

    await prisma.commande.delete({
      where: { id },
    });

    revalidatePath("/dashboard/commandes")
    revalidatePath("/dashboard")

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, COMMANDE.UNEXPECTED_ERROR) };
  }
}

export const deleteCommande = withActionGuard(deleteCommandeHandler, { name: 'commandes:delete' })
