/**
 * One-shot migration script.
 *
 * Finds all Commandes where eventId IS NULL and eventDate IS NOT NULL,
 * creates a corresponding Event record for each, and links it via eventId.
 *
 * Usage:
 *   npx tsx scripts/backfill-event-ids.ts
 *
 * Safe to run multiple times — skips commandes that already have eventId.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding commandes without eventId but with eventDate…');

  const candidates = await prisma.commande.findMany({
    where: {
      eventId: null,
      eventDate: { not: null },
    },
    select: {
      id: true,
      number: true,
      clientId: true,
      organizationId: true,
      eventType: true,
      eventDate: true,
      location: true,
      guestCount: true,
      contactName: true,
      contactPhone: true,
      notes: true,
      clientBudget: true,
    },
  });

  console.log(`📦 Found ${candidates.length} commande(s) to backfill.`);

  let created = 0;
  let skipped = 0;

  for (const cmd of candidates) {
    if (!cmd.eventDate) {
      skipped++;
      continue;
    }

    const startDate = new Date(cmd.eventDate);
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

    const event = await prisma.event.create({
      data: {
        organizationId: cmd.organizationId,
        clientId: cmd.clientId,
        name: `Événement - ${cmd.number}`,
        type: (cmd.eventType ?? 'OTHER') as any,
        status: 'CONFIRMED',
        startDate,
        endDate,
        location: cmd.location ?? undefined,
        guestCount: cmd.guestCount ?? undefined,
        budget: cmd.clientBudget ?? undefined,
        contactPerson: cmd.contactName ?? undefined,
        contactPhone: cmd.contactPhone ?? undefined,
        notes: cmd.notes ?? undefined,
      },
    });

    await prisma.commande.update({
      where: { id: cmd.id },
      data: { eventId: event.id },
    });

    created++;
    console.log(`  ✅ ${cmd.number} → event ${event.id}`);
  }

  console.log(`\n✅ Done. Created ${created} event(s), skipped ${skipped} (no eventDate).`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
