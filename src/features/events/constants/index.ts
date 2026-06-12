export const EVENT_DEFAULT_PAGE_SIZE = 10;
export const EVENT_SORT_OPTIONS = [
  { value: 'name', label: 'Nom' },
  { value: 'createdAt', label: 'Date de création' },
  { value: 'budget', label: 'Budget' },
  { value: 'lastOrderAt', label: 'Dernière commande' },
  { value: 'startDate', label: 'Date de début' },
];

export type ViewMode = 'table' | 'calendar';

export const SPARK_DEFAULTS: Record<string, number[]> = {
  DRAFT: [2, 3, 2, 4, 3, 5, 4],
  PLANNED: [3, 4, 5, 4, 6, 5, 7],
  CONFIRMED: [4, 6, 5, 7, 8, 9, 12],
  IN_PROGRESS: [1, 2, 2, 3, 3, 4, 5],
  COMPLETED: [5, 7, 8, 10, 12, 14, 18],
  CANCELLED: [1, 1, 2, 1, 2, 1, 1],
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Mariage', CORPORATE: 'Entreprise', BIRTHDAY: 'Anniversaire',
  ANNIVERSARY: 'Anniversaire', HOLIDAY: 'Gala', OTHER: 'Autre',
};

export const eventTypeKeys: string[] = ['WEDDING', 'CORPORATE', 'BIRTHDAY', 'ANNIVERSARY', 'HOLIDAY', 'OTHER'];

export const STATUS_LABELS_LOCAL: Record<string, string> = {
  CONFIRMED: 'Confirmé', PLANNED: 'Planifié', IN_PROGRESS: 'En cours',
  CANCELLED: 'Annulé', DRAFT: 'Brouillon', COMPLETED: 'Terminé',
};

export const TYPE_BAR: Record<string, string> = {
  WEDDING: 'bg-rose-50 border-rose-300 text-rose-900',
  CORPORATE: 'bg-blue-50 border-blue-300 text-blue-900',
  BIRTHDAY: 'bg-purple-50 border-purple-300 text-purple-900',
  ANNIVERSARY: 'bg-amber-50 border-amber-300 text-amber-900',
  HOLIDAY: 'bg-orange-50 border-orange-300 text-orange-900',
  OTHER: 'bg-gray-50 border-gray-300 text-gray-800',
};

export const TYPE_BAR_HOVER: Record<string, string> = {
  WEDDING: 'hover:bg-rose-100 hover:border-rose-400',
  CORPORATE: 'hover:bg-blue-100 hover:border-blue-400',
  BIRTHDAY: 'hover:bg-purple-100 hover:border-purple-400',
  ANNIVERSARY: 'hover:bg-amber-100 hover:border-amber-400',
  HOLIDAY: 'hover:bg-orange-100 hover:border-orange-400',
  OTHER: 'hover:bg-gray-100 hover:border-gray-400',
};

export const TYPE_ACCENT: Record<string, string> = {
  WEDDING: 'bg-rose-400', CORPORATE: 'bg-blue-400', BIRTHDAY: 'bg-purple-400',
  ANNIVERSARY: 'bg-amber-400', HOLIDAY: 'bg-orange-400', OTHER: 'bg-gray-400',
};

export const TYPE_LABEL: Record<string, string> = {
  WEDDING: 'Mariage', CORPORATE: 'Corporate', BIRTHDAY: 'Anniversaire',
  ANNIVERSARY: 'Anniversaire', HOLIDAY: 'Vacances', OTHER: 'Autre',
};
