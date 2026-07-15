'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { ActionResponse, CommandeWithDetails } from '@/features/commandes/types';
import { serializeCommande, serializeCommandeItem, serializePaymentSummary } from '@/features/commandes/lib/serialize-commande';
import { getOrganizationId } from '@/lib/get-organization-id';
import { COMMANDE } from '@/lib/notify/messages';
import { assertCan } from '@/lib/assert-role';

const getCommandeByIdSchema = z.object({
  id: z.string().min(1),
});

export async function getCommandeById(id: string): Promise<ActionResponse<CommandeWithDetails>> {
  try {
    getCommandeByIdSchema.parse({ id });
    const organizationId = await getOrganizationId();
    await assertCan('commandes', 'read');

    const commande = await prisma.commande.findFirst({
      where: { id, organizationId },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        event: {
          select: {
            id: true, name: true, type: true, startDate: true, endDate: true, status: true,
            guestCount: true, location: true, budget: true,
            contactPerson: true, contactPhone: true, notes: true,
          },
        },
        menu: {
          select: { id: true, name: true },
        },
        items: {
          include: {
            menuItem: {
              select: { category: true, imageUrl: true },
            },
          },
        },
        tasks: true,
        attachments: true,
        activities: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            reference: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!commande) {
      return { success: false, error: COMMANDE.NOT_FOUND };
    }

    const result: CommandeWithDetails = {
      ...serializeCommande(commande as Parameters<typeof serializeCommande>[0]),
      paymentStatus: commande.paymentStatus,
      client: commande.client ? {
        id: commande.client.id,
        name: commande.client.name,
        email: commande.client.email,
        phone: commande.client.phone,
      } : null,
      event: commande.event ? {
        id: commande.event.id,
        name: commande.event.name,
        type: commande.event.type,
        startDate: commande.event.startDate,
        endDate: commande.event.endDate,
        status: commande.event.status,
        guestCount: commande.event.guestCount,
        location: commande.event.location,
        budget: commande.event.budget ? Number(commande.event.budget) : null,
        contactPerson: commande.event.contactPerson,
        contactPhone: commande.event.contactPhone,
        notes: commande.event.notes,
      } : null,
      menu: commande.menu ? { id: commande.menu.id, name: commande.menu.name } : null,
      items: commande.items.map(item => ({
        ...serializeCommandeItem(item),
        category: item.menuItem?.category ?? null,
        imageUrl: item.menuItem?.imageUrl ?? null,
      })),
      tasks: commande.tasks,
      attachments: commande.attachments,
      activities: commande.activities,
      payments: (commande.payments ?? []).map(serializePaymentSummary),
    };

    return { success: true, data: result };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : COMMANDE.UNEXPECTED_ERROR };
  }
}
