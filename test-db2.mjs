import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tests = [];

  // Test 1: commande aggregate
  tests.push(
    prisma.commande.aggregate({ where: {}, _sum: { totalAmount: true } })
      .then(r => `OK commande.aggregate: ${JSON.stringify(r._sum)}`)
      .catch(e => `FAIL commande.aggregate: ${e.message}`)
  );

  // Test 2: event aggregate
  tests.push(
    prisma.event.aggregate({ where: {}, _sum: { budget: true } })
      .then(r => `OK event.aggregate: ${JSON.stringify(r._sum)}`)
      .catch(e => `FAIL event.aggregate: ${e.message}`)
  );

  // Test 3: commandeItem groupBy
  tests.push(
    prisma.commandeItem.groupBy({ by: ['name'], where: {}, _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 1 })
      .then(r => `OK commandeItem.groupBy: ${r.length} results, first: ${r[0]?.name ?? 'none'}`)
      .catch(e => `FAIL commandeItem.groupBy: ${e.message}`)
  );

  // Test 4: client.count with createdAt filter
  tests.push(
    prisma.client.count({ where: { createdAt: { gte: new Date('2024-01-01') } } })
      .then(r => `OK client.count: ${r}`)
      .catch(e => `FAIL client.count: ${e.message}`)
  );

  // Test 5: commandeActivity via nested relation filter
  tests.push(
    prisma.commandeActivity.findMany({ where: { commande: {} }, take: 1 })
      .then(r => `OK commandeActivity.findMany: ${r.length} results`)
      .catch(e => `FAIL commandeActivity.findMany: ${e.message}`)
  );

  // Test 6: client.findFirst with orderBy totalSpent
  tests.push(
    prisma.client.findFirst({ orderBy: { totalSpent: 'desc' }, select: { name: true, totalSpent: true } })
      .then(r => `OK client.findFirst: ${r?.name ?? 'none'}`)
      .catch(e => `FAIL client.findFirst: ${e.message}`)
  );

  // Test 7: event.count with createdAt filter (for perfEvents)
  tests.push(
    prisma.event.count({ where: { createdAt: { gte: new Date('2024-01-01') } } })
      .then(r => `OK event.count: ${r}`)
      .catch(e => `FAIL event.count: ${e.message}`)
  );

  const results = await Promise.all(tests);
  results.forEach(r => console.log(r));
  
  await prisma.$disconnect();
}

main().catch(console.error);
