export const COMMANDE_DEFAULT_PAGE_SIZE = 10;

export const COMMANDE_SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date de création' },
  { value: 'number', label: 'Référence' },
  { value: 'totalAmount', label: 'Total' },
  { value: 'eventDate', label: "Date d'événement" },
] as const;

export const COMMANDE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  QUOTED: 'Devis',
  CONFIRMED: 'Confirmée',
  IN_PROGRESS: 'En cours',
  READY: 'Prête',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export const COMMANDE_STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200/60',
  QUOTED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300/60',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-1 ring-amber-300/60',
  READY: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60',
  DELIVERED: 'bg-emerald-700 text-white ring-1 ring-emerald-600/60',
  CANCELLED: 'bg-red-50 text-red-700 ring-1 ring-red-200/60',
};
