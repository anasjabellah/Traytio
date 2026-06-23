"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"

export type OrgInfo = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
};

export async function getOrganizationInfo(): Promise<OrgInfo | null> {
  try {
    const organizationId = await getOrganizationId()
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, address: true, city: true, country: true, phone: true, email: true },
    })
    return org
  } catch {
    return null
  }
}
