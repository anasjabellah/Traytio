import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
try {
  const i = await p.invoice.findFirst({ orderBy: { createdAt: "desc" } });
  console.log(JSON.stringify({ id: i.id, number: i.number, type: i.type, status: i.status }));
} catch (e) {
  console.error(e.message);
} finally {
  await p.$disconnect();
}
