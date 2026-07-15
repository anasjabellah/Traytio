'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResponse } from "@/features/clients/types";
import { getOrganizationId } from "@/lib/get-organization-id";
import { CLIENT } from "@/lib/notify/messages";
import { assertCan } from "@/lib/assert-role";
import { withActionGuard } from "@/lib/action-guard";

const deleteClientSchema = z.object({
  id: z.string().min(1),
});

async function deleteClientHandler(id: string): Promise<ActionResponse<void>> {
  try {
    const parsed = deleteClientSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? CLIENT.UNEXPECTED_ERROR };
    }

    const organizationId = await getOrganizationId();
    await assertCan('clients', 'delete');

    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!client) {
      return { success: false, error: CLIENT.NOT_FOUND_OR_ACCESS_DENIED };
    }

    // Check for active commandes (not cancelled or delivered)
    const activeCommandesCount = await prisma.commande.count({
      where: {
        clientId: id,
        organizationId,
        status: {
          notIn: ['CANCELLED', 'DELIVERED']
        }
      }
    });

    if (activeCommandesCount > 0) {
      return {
        success: false,
        error: CLIENT.HAS_ACTIVE_COMMANDES
      };
    }

    // Safe to delete
    await prisma.client.delete({
      where: { id }
    });

    revalidatePath("/dashboard/clients")

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || CLIENT.UNEXPECTED_ERROR };
  }
}

export const deleteClient = withActionGuard(deleteClientHandler, { name: 'clients:delete' })