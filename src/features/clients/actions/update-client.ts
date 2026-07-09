'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResponse, Client } from "@/features/clients/types";
import { updateClientSchema } from "@/features/clients/validations/update-client-schema";
import { CLIENT } from "@/lib/notify/messages";
import { getOrganizationId } from "@/lib/get-organization-id";
import { assertCan } from "@/lib/assert-role";

export async function updateClient(id: string, input: unknown): Promise<ActionResponse<Client>> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('clients', 'update');

    // Validate input with safeParse
    const result = updateClientSchema.safeParse(input);
    if (!result.success) {
      return { success: false, error: CLIENT.INVALID_INPUT };
    }

    // Verify client belongs to organization before update
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!existingClient) {
      return { success: false, error: CLIENT.NOT_FOUND_OR_ACCESS_DENIED };
    }

    const { name, email, phone, address, city, postalCode, company, siret, notes } = result.data;

    // Check email uniqueness within same organization (if email is being changed)
    if (email && email !== existingClient.email) {
      const emailExists = await prisma.client.findFirst({
        where: {
          organizationId,
          email
        }
      });

      if (emailExists) {
        return { success: false, error: CLIENT.DUPLICATE_EMAIL };
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        email: email ?? null,
        phone: phone ?? null,
        address: address ?? undefined,
        city: city ?? null,
        postalCode: postalCode ?? undefined,
        company: company ?? null,
        siret: siret ?? undefined,
        notes: notes ?? undefined
      }
    });

    revalidatePath("/dashboard/clients")

    return { success: true, data: {
    id: client.id,
    organizationId: client.organizationId,
    name: client.name,
    email: client.email,
    phone: client.phone,
    address: client.address,
    city: client.city,
    postalCode: client.postalCode,
    company: client.company,
    siret: client.siret,
    notes: client.notes,
    totalSpent: Number(client.totalSpent),
    lastOrderAt: client.lastOrderAt,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  } as import("@/features/clients/types").Client };
  } catch (error: any) {
    return { success: false, error: error.message || CLIENT.UNEXPECTED_ERROR };
  }
}