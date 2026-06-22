import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { recalculateCommandeBalances } from '@/features/financial/recalculate-commande-balances';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Finding all commandes to backfill financial balances…');

  const commandes = await prisma.commande.findMany({
    select: { id: true, number: true },
    orderBy: { number: 'asc' },
  });

  console.log(`Found ${commandes.length} commande(s) to process.\n`);

  let repaired = 0;
  let skipped = 0;

  for (const cmd of commandes) {
    const before = await prisma.commande.findUnique({
      where: { id: cmd.id },
      select: {
        totalAmount: true,
        paidAmount: true,
        remainingAmount: true,
        paymentStatus: true,
      },
    });

    if (!before) {
      skipped++;
      continue;
    }

    const expectedRemaining = Number(before.totalAmount) - Number(before.paidAmount);
    const isConsistent = Number(before.remainingAmount) === expectedRemaining;

    await recalculateCommandeBalances(prisma, cmd.id);

    if (!isConsistent) {
      const after = await prisma.commande.findUnique({
        where: { id: cmd.id },
        select: {
          paidAmount: true,
          remainingAmount: true,
          paymentStatus: true,
        },
      });
      console.log(
        `  ${isConsistent ? '✓' : '🛠'} ${cmd.number}: ` +
        `total=${Number(before.totalAmount).toFixed(2)}, ` +
        `paid=${Number(before.paidAmount).toFixed(2)} → ${Number(after?.paidAmount ?? 0).toFixed(2)}, ` +
        `remaining=${Number(before.remainingAmount).toFixed(2)} → ${Number(after?.remainingAmount ?? 0).toFixed(2)}, ` +
        `status=${before.paymentStatus} → ${after?.paymentStatus}`
      );
      repaired++;
    } else {
      skipped++;
    }
  }

  console.log(`\nDone. ${repaired} commande(s) repaired, ${skipped} already consistent.`);

  console.log('\nVerifying invariant: remainingAmount = totalAmount - paidAmount…');
  const violations = await prisma.commande.findMany({
    where: {
      remainingAmount: { not: undefined },
    },
  });

  const bad = violations.filter(
    (c) => Number(c.remainingAmount) !== Number(c.totalAmount) - Number(c.paidAmount)
  );

  if (bad.length === 0) {
    console.log('All commandes are consistent. ✓');
  } else {
    console.error(`Found ${bad.length} commande(s) still violating the invariant:`);
    for (const c of bad) {
      console.error(
        `  ${c.number}: remaining=${Number(c.remainingAmount).toFixed(2)} ` +
        `!= total=${Number(c.totalAmount).toFixed(2)} - paid=${Number(c.paidAmount).toFixed(2)}`
      );
    }
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
