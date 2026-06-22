"use client"

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, CreditCard, Landmark, Receipt, Ban, Hash } from "lucide-react";
import { toast } from "sonner";
import { recordPayment } from "@/features/payments/actions/record-payment";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Espèces", icon: Wallet },
  { value: "CARD", label: "Carte", icon: CreditCard },
  { value: "TRANSFER", label: "Virement", icon: Landmark },
  { value: "CHECK", label: "Chèque", icon: Receipt },
  { value: "OTHER", label: "Autre", icon: Ban },
] as const;

const METHOD_PLACEHOLDERS: Record<string, { placeholder: string; icon: typeof Hash }> = {
  CARD: { placeholder: "ID de transaction", icon: Hash },
  TRANSFER: { placeholder: "Référence bancaire", icon: Hash },
  CHECK: { placeholder: "Numéro du chèque", icon: Hash },
  OTHER: { placeholder: "Référence (optionnelle)", icon: Hash },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const } },
};

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandeId: string;
  onSuccess: () => void;
  defaultAmount?: number;
}

export function AddPaymentDialog({
  open,
  onOpenChange,
  commandeId,
  onSuccess,
  defaultAmount,
}: AddPaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && defaultAmount && defaultAmount > 0) {
      setAmount(String(defaultAmount));
    }
  }, [open, defaultAmount]);

  const resetForm = () => {
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setMethod("CASH");
    setReference("");
    setNotes("");
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    const errors: Record<string, string> = {};

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = "Le montant doit être supérieur à 0";
    }
    if (!date) {
      errors.date = "La date est requise";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await recordPayment({
        commandeId,
        amount: parsedAmount,
        date,
        method,
        reference: reference || null,
        notes: notes || null,
      });

      if (result.success) {
        toast.success("Paiement enregistré avec succès");
        resetForm();
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Erreur lors de l'enregistrement du paiement");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refConfig = useMemo(
    () => (method !== "CASH" ? METHOD_PLACEHOLDERS[method] ?? METHOD_PLACEHOLDERS.OTHER : null),
    [method],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col p-0 gap-0 overflow-hidden max-h-[85vh] max-w-[760px] sm:max-w-[760px] z-[60] rounded-2xl border-border shadow-lift">

        {/* ─── HEADER ─── */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-9 rounded-xl bg-[var(--gold-soft)] flex items-center justify-center">
              <Wallet className="size-4.5 text-[var(--gold-deep)]" strokeWidth={1.8} />
            </div>
            <div>
              <DialogTitle className="font-display text-lg font-semibold text-foreground">
                {defaultAmount ? "Encaisser l'acompte" : "Ajouter un paiement"}
              </DialogTitle>
            </div>
          </div>
          <div className="w-10 h-0.5 rounded-full bg-gradient-gold mt-2 mb-2" />
          <DialogDescription className="text-sm text-foreground/60 leading-relaxed">
            {defaultAmount
              ? "Montant pré-rempli. Sélectionnez la méthode et confirmez."
              : "Enregistrez un règlement client pour cette commande."}
          </DialogDescription>
        </div>

        {/* ─── FIELDS ─── */}
        <motion.div
          key={String(open)}
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          <motion.div variants={fadeUp}>
            <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-foreground/60 mb-2">
              Montant <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className={`w-full h-14 rounded-xl border-2 pr-28 pl-5 text-2xl font-semibold tabular-nums tracking-tight transition-all ${
                  fieldErrors.amount
                    ? "border-red-300 bg-red-50 focus:ring-red-200/40 focus:border-red-400"
                    : "border-border bg-white focus:ring-[var(--gold-deep)]/20 focus:border-[var(--gold-deep)]/40"
                } text-foreground placeholder:text-foreground/20 outline-none ring-0 focus:outline-none`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-[var(--gold-soft)] text-[var(--gold-deep)] text-xs font-bold tracking-wide">
                  MAD
                </span>
              </div>
            </div>
            {fieldErrors.amount && (
              <p className="text-xs text-red-600 mt-1.5">{fieldErrors.amount}</p>
            )}
          </motion.div>

          <motion.div variants={fadeUp}>
            <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-foreground/60 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full h-11 rounded-xl border ${
                fieldErrors.date ? "border-red-300 bg-red-50" : "border-border"
              } bg-white px-4 text-sm text-foreground outline-none ring-0 transition-all focus:ring-2 focus:ring-[var(--gold-deep)]/20 focus:border-[var(--gold-deep)]/40`}
            />
            {fieldErrors.date && (
              <p className="text-xs text-red-600 mt-1.5">{fieldErrors.date}</p>
            )}
          </motion.div>

          <motion.div variants={fadeUp}>
            <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-foreground/60 mb-2">
              Méthode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                const isActive = method === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value)}
                    className={`flex flex-col items-center justify-center gap-1.5 h-[68px] rounded-xl border-2 text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-[var(--gold-deep)] text-white border-[var(--gold-deep)] shadow-sm shadow-[var(--gold-deep)]/20 scale-[1.02]"
                        : "bg-white text-foreground/70 border-border hover:border-[var(--gold)]/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className={`size-4.5 ${isActive ? "text-white" : "text-foreground/40"}`} strokeWidth={1.8} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {refConfig && (
            <motion.div variants={fadeUp}>
              <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-foreground/60 mb-2">
                Référence
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none">
                  <refConfig.icon className="size-4" strokeWidth={1.5} />
                </div>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={refConfig.placeholder}
                  className="w-full h-11 rounded-xl border border-border bg-white pl-10 pr-4 text-sm text-foreground placeholder:text-foreground/30 outline-none ring-0 transition-all focus:ring-2 focus:ring-[var(--gold-deep)]/20 focus:border-[var(--gold-deep)]/40"
                />
              </div>
            </motion.div>
          )}

          <motion.div variants={fadeUp}>
            <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-foreground/60 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes additionnelles..."
              rows={2}
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none ring-0 transition-all focus:ring-2 focus:ring-[var(--gold-deep)]/20 focus:border-[var(--gold-deep)]/40 resize-none"
            />
            <p className="text-[11px] text-foreground/40 mt-1.5 italic leading-relaxed">
              Visible uniquement en interne.
            </p>
          </motion.div>
        </motion.div>

        {/* ─── FOOTER ─── */}
        <div className="shrink-0 px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-[var(--surface-elevated)]">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isSubmitting}
            className="text-foreground/60 hover:text-foreground"
          >
            Annuler
          </Button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl bg-gradient-gold text-gold-foreground text-sm font-semibold shadow-gold hover:shadow-gold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting ? "Enregistrement..." : "Enregistrer le paiement"}
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
