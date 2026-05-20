export const CLIENT_DEFAULT_PAGE_SIZE = 10;

export const CLIENT_SORT_OPTIONS = [
  { value: 'name', label: 'Nom' },
  { value: 'createdAt', label: 'Date de création' },
  { value: 'totalSpent', label: 'Total dépensé' },
  { value: 'lastOrderAt', label: 'Dernière commande' },
] as const;
