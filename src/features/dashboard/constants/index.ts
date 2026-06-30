import { Plus, UserPlus, Utensils, PartyPopper, CalendarIcon } from 'lucide-react';
import type { ComponentType } from 'react';

export { formatMAD as mad } from '@/shared/components/kpi-card';

export const STATUS_STYLES: Record<string, string> = {
  "Confirm\u00e9e": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
  "En cours": "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50",
  "Devis": "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50",
  "En attente": "bg-rose-50 text-rose-700 ring-1 ring-rose-200/50",
};

export const COMMANDE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", QUOTED: "Devis", CONFIRMED: "Confirm\u00e9e",
  IN_PROGRESS: "En cours", READY: "Pr\u00eate", DELIVERED: "Livr\u00e9e", CANCELLED: "Annul\u00e9e",
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", PLANNED: "Planifi\u00e9", CONFIRMED: "Confirm\u00e9",
  IN_PROGRESS: "En cours", COMPLETED: "Termin\u00e9", CANCELLED: "Annul\u00e9",
};

export const EVENT_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 ring-1 ring-gray-300/50",
  PLANNED: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50",
  CONFIRMED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50",
  COMPLETED: "bg-emerald-800 text-white ring-1 ring-emerald-900/50",
  CANCELLED: "bg-red-50 text-red-700 ring-1 ring-red-200/50",
};

type ActionConfig = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  to?: string;
  primary?: boolean;
};

export const ACTIONS: ActionConfig[] = [
  { label: "Nouvelle commande", icon: Plus, to: "/dashboard/commandes/new", primary: true },
  { label: "Nouveau client", icon: UserPlus, to: "/dashboard/clients" },
  { label: "Nouveau menu", icon: Utensils, to: "/dashboard/menus" },
  { label: "\u00c9v\u00e9nements", icon: PartyPopper, to: "/dashboard/events" },
  { label: "Ouvrir calendrier", icon: CalendarIcon },
];
