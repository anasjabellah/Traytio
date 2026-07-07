export const INVOICE_DEFAULT_PAGE_SIZE = 10;

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoy\u00e9',
  VIEWED: 'Vu',
  ACCEPTED: 'Accept\u00e9',
  REJECTED: 'Rejet\u00e9',
  PAID: 'Pay\u00e9',
  OVERDUE: 'En retard',
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  SENT: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  VIEWED: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/60',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300/60',
  REJECTED: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60',
  PAID: 'bg-green-50 text-green-700 ring-1 ring-green-300/60',
  OVERDUE: 'bg-red-50 text-red-700 ring-1 ring-red-200/60',
};

export const TYPE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'DEVIS', label: 'Devis' },
  { value: 'FACTURE', label: 'Factures' },
] as const;
