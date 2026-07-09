"use server"

import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { COMMANDE } from "@/lib/notify/messages"
import { assertCan } from "@/lib/assert-role"

export type ClientEventSummary = {
  id: string;
  name: string;
  type: string;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  guestCount: number | null;
  budget: number | null;
  contactPerson: string | null;
  contactPhone: string | null;
  notes: string | null;
  status: string;
};

export async function getCommandeClientEvents(clientId: string) {
  try {
    const organizationId = await getOrganizationId()
    await assertCan('events', 'read')

    const events = await prisma.event.findMany({
      where: { organizationId, clientId },
      select: {
        id: true,
        name: true,
        type: true,
        startDate: true,
        endDate: true,
        location: true,
        guestCount: true,
        budget: true,
        contactPerson: true,
        contactPhone: true,
        notes: true,
        status: true,
      },
      orderBy: { startDate: "desc" },
    })

    return events.map((event) => ({
      id: event.id,
      name: event.name,
      type: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      guestCount: event.guestCount,
      budget: event.budget ? Number(event.budget) : null,
      contactPerson: event.contactPerson,
      contactPhone: event.contactPhone,
      notes: event.notes,
      status: event.status,
    }))
  } catch (err: any) {
    return { error: err.message || COMMANDE.FETCH_ERROR_EVENTS }
  }
}
