'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResponse, Client } from "@/features/clients/types";
import { createClientSchema } from "@/features/clients/validations/create-client-schema";
import { CLIENT } from "@/lib/notify/messages";
import { getOrganizationId } from "@/lib/get-organization-id";
import { assertCan } from "@/lib/assert-role";

export async function createClient(input: unknown): Promise<ActionResponse<Client>> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('clients', 'create');

    // Validate input with safeParse
    const result = createClientSchema.safeParse(input);
    if (!result.success) {
      return { success: false, error: CLIENT.INVALID_INPUT };
    }

    const { name, email, phone, address, city, postalCode, company, siret, notes } = result.data;

    // Check email uniqueness within same organization (if email provided)
    if (email) {
      const existingClient = await prisma.client.findFirst({
        where: {
          organizationId,
          email
        }
      });

      if (existingClient) {
        return { success: false, error: CLIENT.DUPLICATE_EMAIL };
      }
    }

    const client = await prisma.client.create({
      data: {
        name,
        email: email ?? null,
        phone: phone ?? null,
        address: address ?? null,
        city: city ?? null,
        postalCode: postalCode ?? null,
        company: company ?? null,
        siret: siret ?? null,
        notes: notes ?? null,
        organizationId
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