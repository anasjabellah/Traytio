import type { MenuCategory } from '@/features/menus/types';

export const MENU_DEFAULT_PAGE_SIZE = 10;
export const MENU_SORT_OPTIONS = ['name', 'createdAt', 'pricePerPerson', 'minPersons'] as const;

export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  WEDDING: 'Mariage',
  CORPORATE: 'Entreprise',
  BUFFET: 'Buffet',
  COCKTAIL: 'Cocktail',
  BRUNCH: 'Brunch',
  DESSERT: 'Dessert',
  CUSTOM: 'Custom',
};

export const CATEGORY_BADGE_COLORS: Record<MenuCategory, string> = {
  WEDDING: 'bg-pink-100 text-pink-700 border-pink-200',
  CORPORATE: 'bg-blue-100 text-blue-700 border-blue-200',
  BUFFET: 'bg-amber-100 text-amber-700 border-amber-200',
  COCKTAIL: 'bg-purple-100 text-purple-700 border-purple-200',
  BRUNCH: 'bg-orange-100 text-orange-700 border-orange-200',
  DESSERT: 'bg-rose-100 text-rose-700 border-rose-200',
  CUSTOM: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const CATEGORY_EMOJIS: Record<MenuCategory, string> = {
  WEDDING: '💍',
  CORPORATE: '💼',
  BUFFET: '🍽️',
  COCKTAIL: '🍸',
  BRUNCH: '🥞',
  DESSERT: '🍰',
  CUSTOM: '📋',
};

export const CATEGORY_ACCENT: Record<MenuCategory, string> = {
  WEDDING: 'from-pink-100 via-rose-50 to-fuchsia-50',
  CORPORATE: 'from-blue-100 via-indigo-50 to-sky-50',
  BUFFET: 'from-amber-100 via-yellow-50 to-orange-50',
  COCKTAIL: 'from-purple-100 via-violet-50 to-fuchsia-50',
  BRUNCH: 'from-orange-100 via-amber-50 to-yellow-50',
  DESSERT: 'from-rose-100 via-pink-50 to-amber-50',
  CUSTOM: 'from-gray-100 via-zinc-50 to-stone-50',
};
