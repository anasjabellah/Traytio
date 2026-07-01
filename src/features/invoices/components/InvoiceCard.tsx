'use client';

import { motion } from 'framer-motion';
import { FileText, Receipt, Download, Loader2 } from 'lucide-react';
import type { InvoiceWithCommande } from '@/features/invoices/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', SENT: 'Envoy\u00e9', VIEWED: 'Vu',
  ACCEPTED: 'Accept\u00e9', REJECTED: 'Rejet\u00e9', PAID: 'Pay\u00e9', OVERDUE: 'En retard',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  SENT: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  VIEWED: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/60',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300/60',
  REJECTED: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60',
  PAID: 'bg-green-50 text-green-700 ring-1 ring-green-300/60',
  OVERDUE: 'bg-red-50 text-red-700 ring-1 ring-red-200/60',
};

interface InvoiceCardProps {
  invoice: InvoiceWithCommande;
  index: number;
  onView: (id: string) => void;
  onDownload: (e: React.MouseEvent, invoice: InvoiceWithCommande) => void;
  downloading: string | null;
}

export function InvoiceCard({ invoice: inv, index, onView, onDownload, downloading }: InvoiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      onClick={() => onView(inv.id)}
      className="group rounded-2xl border border-border/60 bg-card shadow-soft hover:shadow-lift transition-all cursor-pointer"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="size-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center shrink-0">
              {inv.type === 'DEVIS' ? (
                <FileText className="size-4 text-blue-600" strokeWidth={1.8} />
              ) : (
                <Receipt className="size-4 text-[var(--gold-deep)]" strokeWidth={1.8} />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{inv.number}</div>
              <div className="text-[10px] text-foreground/50">
                {inv.type === 'DEVIS' ? 'Devis' : 'Facture'}
              </div>
            </div>
          </div>
          <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABELS[inv.status] || inv.status}
          </span>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Client</span>
            <span className="font-medium text-foreground truncate ml-2">{inv.commande?.client?.name ?? '\u2014'}</span>
          </div>
          <div className="flex justify-between">
            <span>Commande</span>
            <span className="font-medium text-foreground">{inv.commande?.number ?? '\u2014'}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span className="font-medium text-foreground">
              {new Date(inv.issueDate).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
            <div className="text-sm font-bold tabular-nums text-foreground">{mad(inv.totalAmount)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Pay\u00e9</div>
            <div className="text-sm font-semibold tabular-nums text-emerald-600">{mad(inv.paidAmount)}</div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={(e) => onDownload(e, inv)}
          disabled={downloading === inv.id}
          className="w-full flex items-center justify-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-2.5 text-xs font-medium text-muted-foreground/60 transition-all hover:shadow-sm hover:text-foreground hover:border-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading === inv.id ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={1.8} />
          ) : (
            <Download className="size-3.5" strokeWidth={1.8} />
          )}
          T\u00e9l\u00e9charger
        </button>
      </div>
    </motion.div>
  );
}
