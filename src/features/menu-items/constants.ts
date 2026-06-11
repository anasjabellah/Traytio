import type { MenuItemCategory } from './types';

export const CATEGORY_LABELS: Record<MenuItemCategory, string> = {
  FOOD: 'Food',
  DRINKS: 'Drinks',
  DESSERTS: 'Desserts',
  DECORATION: 'Decoration',
  STAFF: 'Services',
  ENTERTAINMENT: 'Divertissement',
  EXTRAS: 'Extras',
};

export const CATEGORY_BADGE_COLORS: Record<MenuItemCategory, string> = {
  FOOD: 'bg-orange-100 text-orange-700 border-orange-200',
  DRINKS: 'bg-blue-100 text-blue-700 border-blue-200',
  DESSERTS: 'bg-pink-100 text-pink-700 border-pink-200',
  DECORATION: 'bg-purple-100 text-purple-700 border-purple-200',
  STAFF: 'bg-green-100 text-green-700 border-green-200',
  ENTERTAINMENT: 'bg-red-100 text-red-700 border-red-200',
  EXTRAS: 'bg-amber-100 text-amber-700 border-amber-200',
};
