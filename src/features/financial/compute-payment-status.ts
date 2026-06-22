import type { CommandePaymentStatus } from "@prisma/client";

type PaymentStatusInput = {
  paidAmount: number;
  totalAmount: number;
  acompteAmount: number;
};

export function isDepositReached(paidAmount: number, acompteAmount: number): boolean {
  return acompteAmount > 0 && paidAmount >= acompteAmount;
}

export function computePaymentStatus(input: PaymentStatusInput): CommandePaymentStatus {
  const { paidAmount, totalAmount, acompteAmount } = input;

  if (paidAmount >= totalAmount && totalAmount > 0) {
    return "PAID";
  }

  if (isDepositReached(paidAmount, acompteAmount)) {
    return "DEPOSIT_PAID";
  }

  if (paidAmount > 0) {
    return "PARTIALLY_PAID";
  }

  return "UNPAID";
}
