'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import type { ActionResponse } from "@/features/clients/types";

async function getOrganizationId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const userOrg = await prisma.userOrganization.findFirst({
    where: { user: { clerkId: userId } },
    select: { organizationId: true }
  })

  if (!userOrg) throw new Error("Organization not found")
  return userOrg.organizationId
}

export async function deleteClient(id: string): Promise<ActionResponse<void>> {
  try {
    const organizationId = await getOrganizationId();

    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!client) {
      return { success: false, error: "Client not found or access denied" };
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
        error: "Impossible de supprimer ce client car il possède des commandes actives"
      };
    }

    // Safe to delete
    await prisma.client.delete({
      where: { id }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred" };
  }
}