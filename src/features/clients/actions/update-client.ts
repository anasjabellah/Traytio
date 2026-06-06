'use server';

import { prisma } from "@/lib/prisma";
import type { ActionResponse, Client } from "@/features/clients/types";
import { updateClientSchema } from "@/features/clients/validations/update-client-schema";
import { getOrganizationId } from "@/lib/get-organization-id";

export async function updateClient(id: string, input: unknown): Promise<ActionResponse<Client>> {
  try {
    const organizationId = await getOrganizationId();

    // Validate input with safeParse
    const result = updateClientSchema.safeParse(input);
    if (!result.success) {
      return { success: false, error: "Invalid input data" };
    }

    // Verify client belongs to organization before update
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!existingClient) {
      return { success: false, error: "Client not found or access denied" };
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
        return { success: false, error: "A client with this email already exists in your organization" };
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        email: email ?? null,
        phone: phone ?? null,
        address: address ?? null,
        city: city ?? null,
        postalCode: postalCode ?? null,
        company: company ?? null,
        siret: siret ?? null,
        notes: notes ?? null
      }
    });

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
    return { success: false, error: error.message || "An error occurred" };
  }
}