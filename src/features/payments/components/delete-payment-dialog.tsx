"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { deletePayment } from "@/features/payments/actions/delete-payment";

interface DeletePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  amount: number;
  onSuccess: () => void;
}

export function DeletePaymentDialog({
  open,
  onOpenChange,
  paymentId,
  amount,
  onSuccess,
}: DeletePaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await deletePayment(paymentId);
      if (resp.success) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError(resp.error ?? "Une erreur est survenue");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const mad = (n: number) =>
    new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="size-14 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="size-6 text-red-600" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="font-display text-xl">Supprimer le paiement</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Êtes-vous sûr de vouloir supprimer ce paiement de{" "}
                  <span className="font-semibold text-foreground">{mad(amount)}</span> ?
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Cette action est irréversible. Les soldes seront recalculés.
                </p>
              </div>

              {error && (
                <div className="w-full rounded-xl bg-red-50 text-red-700 text-sm px-4 py-2.5">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {loading ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
