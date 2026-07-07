import type { MenuItemCategory } from './types';

export const MENU_ITEM_DEFAULT_PAGE_SIZE = 10;

export const CATEGORY_LABELS: Record<MenuItemCategory, string> = {
  FOOD: 'Aliment',
  DRINKS: 'Boisson',
  DESSERTS: 'Dessert',
  DECORATION: 'D\u00e9coration',
  STAFF: 'Personnel',
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

export const CATEGORY_ACCENT: Record<MenuItemCategory, string> = {
  FOOD: 'from-orange-50 to-amber-50',
  DRINKS: 'from-blue-50 to-sky-50',
  DESSERTS: 'from-pink-50 to-rose-50',
  DECORATION: 'from-purple-50 to-violet-50',
  STAFF: 'from-green-50 to-emerald-50',
  ENTERTAINMENT: 'from-red-50 to-rose-50',
  EXTRAS: 'from-amber-50 to-yellow-50',
};

export const ITEM_EMOJI: Record<MenuItemCategory, string> = {
  FOOD: '\u{1F372}',
  DRINKS: '\u{1F379}',
  DESSERTS: '\u{1F36C}',
  DECORATION: '\u{1F490}',
  STAFF: '\u{1F3A9}',
  ENTERTAINMENT: '\u{1F3A7}',
  EXTRAS: '\u{1F386}',
};
