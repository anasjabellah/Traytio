'use server';

import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';

export type ActivityItem = {
  id: string;
  type: 'client_created' | 'client_updated' | 'commande_created' | 'event_assigned' | 'payment_received';
  description: string;
  clientName: string;
  clientId?: string;
  createdAt: Date;
};

export async function getClientActivity(): Promise<ActivityItem[]> {
  const organizationId = await getOrganizationId();

  const [newClients, recentCommandes, recentEvents, recentPayments, updatedClients] = await Promise.all([
    prisma.client.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.commande.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        number: true,
        createdAt: true,
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.event.findMany({
      where: { organizationId, clientId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.payment.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        invoice: {
          select: {
            commande: {
              select: {
                client: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.client.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    }),
  ]);

  const activities: ActivityItem[] = [];

  for (const c of newClients) {
    activities.push({
      id: `client-${c.id}`,
      type: 'client_created',
      description: 'Nouveau client créé',
      clientName: c.name,
      clientId: c.id,
      createdAt: c.createdAt,
    });
  }

  for (const c of updatedClients) {
    const changed = c.updatedAt.getTime() - c.createdAt.getTime() > 1000;
    if (changed) {
      activities.push({
        id: `client-updated-${c.id}`,
        type: 'client_updated',
        description: 'Informations client mises à jour',
        clientName: c.name,
        clientId: c.id,
        createdAt: c.updatedAt,
      });
    }
  }

  for (const cmd of recentCommandes) {
    if (cmd.client) {
      activities.push({
        id: `commande-${cmd.id}`,
        type: 'commande_created',
        description: `Commande #${cmd.number} créée pour ce client`,
        clientName: cmd.client.name,
        clientId: cmd.client.id,
        createdAt: cmd.createdAt,
      });
    }
  }

  for (const ev of recentEvents) {
    if (ev.client) {
      activities.push({
        id: `event-${ev.id}`,
        type: 'event_assigned',
        description: 'Client associé à un événement',
        clientName: ev.client.name,
        clientId: ev.client.id,
        createdAt: ev.createdAt,
      });
    }
  }

  for (const pmt of recentPayments) {
    const client = pmt.invoice?.commande?.client;
    if (client) {
      activities.push({
        id: `payment-${pmt.id}`,
        type: 'payment_received',
        description: `Paiement de ${Number(pmt.amount).toLocaleString('fr-FR')} MAD reçu pour ce client`,
        clientName: client.name,
        clientId: client.id,
        createdAt: pmt.createdAt,
      });
    }
  }

  activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return activities.slice(0, 10);
}
