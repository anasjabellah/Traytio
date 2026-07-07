import { Wallet, CreditCard, Landmark, Ban, Receipt, type LucideIcon } from 'lucide-react';

export const PAYMENT_DEFAULT_PAGE_SIZE = 10;

export const METHOD_LABELS: Record<string, string> = {
  CASH: 'Esp\u00e8ces',
  CARD: 'Carte',
  TRANSFER: 'Virement',
  CHECK: 'Ch\u00e8que',
  OTHER: 'Autre',
};

export const METHOD_ICONS: Record<string, LucideIcon> = {
  CASH: Wallet,
  CARD: CreditCard,
  TRANSFER: Landmark,
  CHECK: Receipt,
  OTHER: Ban,
};

export const METHOD_BADGES: Record<string, { label: string; icon: LucideIcon; style: string }> = {
  CASH:    { label: 'Esp\u00e8ces',  icon: Wallet,     style: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50' },
  CARD:    { label: 'Carte',    icon: CreditCard, style: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50' },
  TRANSFER:{ label: 'Virement', icon: Landmark,   style: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/50' },
  CHECK:   { label: 'Ch\u00e8que',   icon: Receipt,    style: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50' },
  OTHER:   { label: 'Autre',    icon: Ban,        style: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200/50' },
};

export const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Compl\u00e9t\u00e9',
  PENDING: 'En attente',
  FAILED: '\u00c9chou\u00e9',
  REFUNDED: 'Rembours\u00e9',
};

export const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300/60',
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  FAILED: 'bg-red-50 text-red-700 ring-1 ring-red-200/60',
  REFUNDED: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200/60',
};
