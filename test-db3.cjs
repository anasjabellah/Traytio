require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const url = process.env.DATABASE_URL;
console.log('DATABASE_URL found:', !!url);
if (!url) { console.log('NO DATABASE_URL'); process.exit(1); }

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tests = [];

  tests.push(
    prisma.commande.aggregate({ where: {}, _sum: { totalAmount: true } })
      .then(r => `OK commande.aggregate: ${JSON.stringify(r._sum)}`)
      .catch(e => `FAIL commande.aggregate: ${e.message}`)
  );

  tests.push(
    prisma.event.aggregate({ where: {}, _sum: { budget: true } })
      .then(r => `OK event.aggregate: ${JSON.stringify(r._sum)}`)
      .catch(e => `FAIL event.aggregate: ${e.message}`)
  );

  tests.push(
    prisma.commandeItem.groupBy({ by: ['name'], where: {}, _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 1 })
      .then(r => `OK commandeItem.groupBy: ${r.length} results`)
      .catch(e => `FAIL commandeItem.groupBy: ${e.message}`)
  );

  tests.push(
    prisma.client.count({ where: { createdAt: { gte: new Date('2024-01-01') } } })
      .then(r => `OK client.count createdAt: ${r}`)
      .catch(e => `FAIL client.count createdAt: ${e.message}`)
  );

  tests.push(
    prisma.commandeActivity.findMany({ where: { commande: {} }, take: 1 })
      .then(r => `OK commandeActivity.findMany: ${r.length} results`)
      .catch(e => `FAIL commandeActivity.findMany: ${e.message}`)
  );

  tests.push(
    prisma.client.findFirst({ orderBy: { totalSpent: 'desc' }, select: { name: true, totalSpent: true } })
      .then(r => `OK client.findFirst totalSpent: ${r?.name ?? 'none'}`)
      .catch(e => `FAIL client.findFirst totalSpent: ${e.message}`)
  );

  tests.push(
    prisma.event.count({ where: { createdAt: { gte: new Date('2024-01-01') } } })
      .then(r => `OK event.count createdAt: ${r}`)
      .catch(e => `FAIL event.count createdAt: ${e.message}`)
  );

  const results = await Promise.all(tests);
  results.forEach(r => console.log(r));
  
  await prisma.$disconnect();
}

main().catch(console.error);
