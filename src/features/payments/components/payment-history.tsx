"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, CreditCard, Landmark, Ban, Wallet, Receipt, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { DeletePaymentDialog } from "./delete-payment-dialog";
import type { PaymentSummary } from "@/features/commandes/types";

const METHOD_BADGES: Record<string, { label: string; icon: typeof CreditCard; style: string }> = {
  CASH:    { label: "Espèces",  icon: Wallet,     style: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50" },
  CARD:    { label: "Carte",    icon: CreditCard, style: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50" },
  TRANSFER:{ label: "Virement", icon: Landmark,   style: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/50" },
  CHECK:   { label: "Chèque",   icon: Receipt,    style: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50" },
  OTHER:   { label: "Autre",    icon: Ban,        style: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/50" },
};

const mad = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);

const formatDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const formatTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

interface PaymentHistoryProps {
  payments: PaymentSummary[];
  onPaymentChange: () => void;
}

export function PaymentHistory({ payments, onPaymentChange }: PaymentHistoryProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; amount: number } | null>(null);

  if (payments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        className="rounded-2xl border border-dashed border-border/60 bg-card shadow-soft p-8 flex flex-col items-center justify-center text-center"
      >
        <div className="size-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
          <Receipt className="size-5 text-emerald-500" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-foreground/60">Aucun paiement enregistré</p>
        <p className="text-xs text-foreground/50 mt-1">
          Ajoutez un paiement pour commencer le suivi.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        className="rounded-2xl border border-border bg-card shadow-soft p-5"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="size-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Receipt className="size-3.5 text-emerald-600" strokeWidth={1.8} />
          </div>
          <h4 className="font-display text-sm font-semibold text-foreground">Historique des paiements</h4>
          <span className="text-xs text-foreground/50 ml-auto tabular-nums">
            {payments.length} paiement{payments.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="relative">
          <div className="absolute left-[10px] top-2 bottom-2 w-px bg-border/40" />

          <div className="space-y-0">
            {payments.map((payment, i) => {
              const badge = METHOD_BADGES[payment.method];
              const Icon = badge?.icon ?? Ban;
              const colorStyle = badge?.style ?? "bg-gray-100 text-gray-600 ring-1 ring-gray-200/50";
              const isRefunded = payment.status === "REFUNDED";

              return (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
                  className="relative flex items-start gap-3.5 pb-4 last:pb-0 group"
                >
                  <div className={`relative z-10 size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ring-2 ring-white ${isRefunded ? "bg-red-100" : "bg-emerald-100"}`}>
                    {isRefunded ? (
                      <ArrowUpFromLine className="size-2.5 text-red-600" strokeWidth={3} />
                    ) : (
                      <ArrowDownToLine className="size-2.5 text-emerald-600" strokeWidth={3} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {isRefunded ? "-" : "+"}{mad(payment.amount)}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${colorStyle}`}>
                        <Icon className="size-3" strokeWidth={2} />
                        {badge?.label ?? payment.method}
                      </span>
                      {isRefunded && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                          Remboursé
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-foreground/50 mt-1">
                      <span>{formatDate(payment.createdAt)}</span>
                      <span className="size-0.5 rounded-full bg-foreground/30 shrink-0" />
                      <span>{formatTime(payment.createdAt)}</span>
                      {payment.reference && (
                        <>
                          <span className="size-0.5 rounded-full bg-foreground/30 shrink-0" />
                          <span>Réf: {payment.reference}</span>
                        </>
                      )}
                    </div>

                    {payment.notes && (
                      <p className="text-[11px] text-foreground/50 mt-1 italic leading-relaxed line-clamp-2">
                        {payment.notes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setDeleteTarget({ id: payment.id, amount: payment.amount })}
                    className="size-7 rounded-lg border border-transparent flex items-center justify-center text-foreground/20 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                    title="Supprimer le paiement"
                  >
                    <Trash2 className="size-3" strokeWidth={1.8} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {deleteTarget && (
        <DeletePaymentDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          paymentId={deleteTarget.id}
          amount={deleteTarget.amount}
          onSuccess={onPaymentChange}
        />
      )}
    </>
  );
}
