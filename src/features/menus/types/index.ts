import type { Prisma } from '@prisma/client';

export type MenuCategory =
  | 'WEDDING'
  | 'CORPORATE'
  | 'BUFFET'
  | 'COCKTAIL'
  | 'BRUNCH'
  | 'DESSERT'
  | 'CUSTOM';

export type Menu = {
  id: string;
  organizationId: string;
  name: string;
  category: MenuCategory;
  pricePerPerson: number; // stored as Decimal in DB
  minPersons: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMenuInput = {
  name: string;
  category: MenuCategory;
  pricePerPerson: number;
  minPersons?: number;
  isActive?: boolean;
};

export type UpdateMenuInput = Partial<CreateMenuInput> & { id: string };

export type GetMenusParams = {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'pricePerPerson' | 'minPersons';
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedMenus = {
  data: Menu[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};
