'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Wallet, CreditCard, Landmark, Ban, Receipt, ArrowUpRight } from 'lucide-react';
import type { PaymentWithCommande } from '@/features/payments/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

const formatDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

const METHOD_ICONS: Record<string, typeof CreditCard> = {
  CASH: Wallet, CARD: CreditCard, TRANSFER: Landmark, CHECK: Receipt, OTHER: Ban,
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Espèces', CARD: 'Carte', TRANSFER: 'Virement', CHECK: 'Chèque', OTHER: 'Autre',
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Complété', PENDING: 'En attente', FAILED: 'Échoué', REFUNDED: 'Remboursé',
};

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300/60',
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  FAILED: 'bg-red-50 text-red-700 ring-1 ring-red-200/60',
  REFUNDED: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200/60',
};

interface PaymentRowCardProps {
  payment: PaymentWithCommande;
  index: number;
}

export function PaymentRowCard({ payment, index }: PaymentRowCardProps) {
  const Icon = METHOD_ICONS[payment.method] ?? Ban;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      className="rounded-2xl border border-border/60 bg-card shadow-soft hover:shadow-lift transition-all"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold tabular-nums text-foreground">{mad(payment.amount)}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="size-5 rounded-md bg-emerald-50 flex items-center justify-center">
                <Icon className="size-3 text-emerald-600" strokeWidth={1.8} />
              </div>
              <span className="text-xs text-foreground/70">{METHOD_LABELS[payment.method] ?? payment.method}</span>
            </div>
          </div>
          <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${STATUS_STYLES[payment.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABELS[payment.status] ?? payment.status}
          </span>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Commande</span>
            <Link
              href={`/dashboard/commandes/${payment.commande.id}`}
              className="font-medium text-foreground hover:text-[var(--gold-deep)] transition-colors inline-flex items-center gap-1"
            >
              {payment.commande.number}
              <ArrowUpRight className="size-2.5" strokeWidth={2} />
            </Link>
          </div>
          {payment.commande.clientName && (
            <div className="flex justify-between">
              <span>Client</span>
              <span className="font-medium text-foreground truncate ml-2">{payment.commande.clientName}</span>
            </div>
          )}
          {payment.reference && (
            <div className="flex justify-between">
              <span>Réf.</span>
              <span className="font-medium text-foreground">{payment.reference}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Date</span>
            <span className="font-medium text-foreground">{formatDate(payment.createdAt)}</span>
          </div>
        </div>

        {payment.notes && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Notes</div>
            <p className="text-xs text-foreground/70 leading-relaxed">{payment.notes}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
