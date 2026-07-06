"use client"

import { motion } from "framer-motion";
import {
  Wallet,
  Plus,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDepositReached } from "@/features/financial/compute-payment-status";

type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "DEPOSIT_PAID" | "PAID" | "REFUNDED";

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Impayé",
  PARTIALLY_PAID: "Partiellement payé",
  DEPOSIT_PAID: "Acompte versé",
  PAID: "Payé",
  REFUNDED: "Remboursé",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  UNPAID: "bg-red-100 text-red-800 ring-1 ring-red-300/60",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800 ring-1 ring-amber-300/60",
  DEPOSIT_PAID: "bg-blue-100 text-blue-800 ring-1 ring-blue-300/60",
  PAID: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60",
  REFUNDED: "bg-gray-200 text-gray-700 ring-1 ring-gray-300/60",
};

const mad = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);

interface PaymentCardProps {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  acompteAmount: number;
  paymentStatus?: string;
  onAddPayment: () => void;
  onCollectDeposit?: () => void;
}

export function PaymentCard({
  totalAmount,
  paidAmount,
  remainingAmount,
  acompteAmount,
  paymentStatus,
  onAddPayment,
  onCollectDeposit,
}: PaymentCardProps) {
  const status = (paymentStatus ?? "UNPAID") as PaymentStatus;
  const paidPct = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;
  const isSold = remainingAmount <= 0;
  const depositReached = isDepositReached(paidAmount, acompteAmount);
  const needsDeposit = acompteAmount > 0 && !depositReached;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className="rounded-2xl border border-border bg-card shadow-soft p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Wallet className="size-3.5 text-emerald-600" strokeWidth={1.8} />
          </div>
          <h4 className="font-display text-sm font-semibold text-foreground">Paiement</h4>
        </div>
        <span
          className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
            PAYMENT_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"
          }`}
        >
          {PAYMENT_STATUS_LABELS[status] ?? status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/70">Total</span>
          <span className="font-semibold tabular-nums text-foreground">{mad(totalAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/70">Payé</span>
          <span className="font-semibold tabular-nums text-emerald-600">{paidAmount > 0 ? mad(paidAmount) : "0 MAD"}</span>
        </div>
        <div className="border-t border-dashed border-border/40" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/70">Reste</span>
          <span
            className={`font-semibold tabular-nums ${
              isSold ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {isSold ? "Soldé ✓" : mad(remainingAmount)}
          </span>
        </div>

        {totalAmount > 0 && (
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] text-foreground/60 mb-1.5">
              <span>Progression</span>
              <span className="font-semibold tabular-nums text-foreground">{paidPct}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-100 to-emerald-200/60 overflow-hidden ring-1 ring-inset ring-emerald-200/30">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all shadow-sm"
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {!isSold && (
        <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
          {needsDeposit && onCollectDeposit && (
            <Button
              variant="default"
              className="w-full h-10 rounded-xl text-xs font-semibold gap-1.5 shadow-sm"
              onClick={onCollectDeposit}
            >
              <Zap className="size-3.5" strokeWidth={2.5} />
              Encaisser acompte
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl border-emerald-200/60 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold gap-1.5"
            onClick={onAddPayment}
          >
            <Plus className="size-3.5" strokeWidth={2.5} />
            Enregistrer un paiement
          </Button>
        </div>
      )}
    </motion.div>
  );
}
