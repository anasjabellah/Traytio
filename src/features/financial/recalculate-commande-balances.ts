import type { PrismaClient } from "@prisma/client";
import { computePaymentStatus } from "./compute-payment-status";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function recalculateClientTotalSpent(
  client: TransactionClient,
  clientId: string,
): Promise<void> {
  const clientAgg = await client.commande.aggregate({
    where: {
      clientId,
      status: { notIn: ["CANCELLED"] },
    },
    _sum: { paidAmount: true },
  });
  const totalSpent = Number(clientAgg._sum.paidAmount ?? 0);
  await client.client.update({
    where: { id: clientId },
    data: { totalSpent },
  });
}

export async function recalculateCommandeBalances(
  client: PrismaClient,
  commandeId: string,
): Promise<void>;
export async function recalculateCommandeBalances(
  client: TransactionClient,
  commandeId: string,
): Promise<void>;
export async function recalculateCommandeBalances(
  client: PrismaClient | TransactionClient,
  commandeId: string,
): Promise<void> {
  const run = async (tx: PrismaClient | TransactionClient) => {
    const aggregate = await tx.payment.aggregate({
      where: {
        commandeId,
        status: { notIn: ["FAILED", "REFUNDED"] },
      },
      _sum: { amount: true },
    });

    const paidAmount = aggregate._sum.amount ?? 0;
    const commande = await tx.commande.findUniqueOrThrow({
      where: { id: commandeId },
      select: {
        totalAmount: true,
        acompteAmount: true,
        clientId: true,
      },
    });

    const totalAmount = Number(commande.totalAmount);
    const acompteAmount = Number(commande.acompteAmount);
    const paid = Number(paidAmount);
    const remainingAmount = Math.max(0, totalAmount - paid);

    const paymentStatus = computePaymentStatus({
      paidAmount: paid,
      totalAmount,
      acompteAmount,
    });

    await tx.commande.update({
      where: { id: commandeId },
      data: {
        paidAmount,
        remainingAmount,
        paymentStatus,
      },
    });

    // Sync paidAmount to all linked invoices
    await tx.invoice.updateMany({
      where: { commandeId },
      data: { paidAmount },
    });

    // Recalculate client totalSpent from all non-cancelled commandes
    if (commande.clientId) {
      await recalculateClientTotalSpent(tx, commande.clientId);
    }
  };

  if ("$transaction" in client) {
    await client.$transaction((tx) => run(tx));
  } else {
    await run(client);
  }
}
