'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResponse } from "@/features/clients/types";
import { getOrganizationId } from "@/lib/get-organization-id";
import { CLIENT } from "@/lib/notify/messages";
import { assertCan } from "@/lib/assert-role";
import { withActionGuard } from "@/lib/action-guard";
import { normalizeActionError } from "@/lib/action-error";

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

    // Check for ALL commandes — Prisma Restrict on Commande.clientId blocks
    // any deletion when commandes exist, regardless of status.
    const commandesCount = await prisma.commande.count({
      where: {
        clientId: id,
        organizationId,
      }
    });

    if (commandesCount > 0) {
      return {
        success: false,
        error: CLIENT.HAS_COMMANDES
      };
    }

    // Defense-in-depth: check for payments linked to this client's commandes.
    // Payment has no direct Client FK (it references Commande), so we check
    // via the commande relation. This must remain organization-scoped.
    const paymentsCount = await prisma.payment.count({
      where: {
        organizationId,
        commande: {
          clientId: id,
        }
      }
    });

    if (paymentsCount > 0) {
      return {
        success: false,
        error: CLIENT.HAS_PAYMENTS
      };
    }

    // Safe to delete
    await prisma.client.delete({
      where: { id, organizationId }
    });

    revalidatePath("/dashboard/clients")

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, CLIENT.UNEXPECTED_ERROR) };
  }
}

export const deleteClient = withActionGuard(deleteClientHandler, { name: 'clients:delete' })
