import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const r = await prisma.commande.aggregate({
    where: {},
    _sum: { totalAmount: true },
  });
  console.log('commande.aggregate success:', JSON.stringify(r));
} catch (e) {
  console.error('commande.aggregate error:', e.message);
}
try {
  const count = await prisma.commandeActivity.count();
  console.log('commandeActivity.count:', count);
} catch (e) {
  console.error('commandeActivity error:', e.message);
}
try {
  const r = await prisma.event.aggregate({
    where: {},
    _sum: { budget: true },
  });
  console.log('event.aggregate success:', JSON.stringify(r));
} catch (e) {
  console.error('event.aggregate error:', e.message);
}
try {
  const r = await prisma.commandeItem.groupBy({
    by: ['name'],
    where: {},
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 1,
  });
  console.log('commandeItem.groupBy success:', JSON.stringify(r));
} catch (e) {
  console.error('commandeItem.groupBy error:', e.message);
}
try {
  const r = await prisma.client.count({
    where: { createdAt: { gte: new Date('2024-01-01'), lt: new Date('2025-01-01') } },
  });
  console.log('client.count with createdAt success:', r);
} catch (e) {
  console.error('client.count with createdAt error:', e.message);
}
try {
  const r = await prisma.event.count({
    where: { createdAt: { gte: new Date('2024-01-01'), lt: new Date('2025-01-01') } },
  });
  console.log('event.count with createdAt success:', r);
} catch (e) {
  console.error('event.count with createdAt error:', e.message);
}
await prisma.$disconnect();
