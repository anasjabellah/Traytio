import type { Prisma } from '@prisma/client';

export type MenuItemCategory =
  | 'FOOD'
  | 'DRINKS'
  | 'DESSERTS'
  | 'DECORATION'
  | 'STAFF'
  | 'ENTERTAINMENT'
  | 'EXTRAS';

export type MenuItem = {
  id: string;
  organizationId: string;
  name: string;
  category: MenuItemCategory;
  unitPrice: number; // stored as Decimal in DB
  unit?: string | null;
  isActive: boolean;
  notes?: string | null;
  imageUrl?: string | null; 
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMenuItemInput = {
  name: string;
  category: MenuItemCategory;
  unitPrice: number;
  unit?: string;
  isActive?: boolean;
  notes?: string;
};

export type UpdateMenuItemInput = Partial<CreateMenuItemInput> & { id: string };

export type GetMenuItemsParams = {
  search?: string;
  category?: string; 
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'unitPrice';
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedMenuItems = {
  data: MenuItem[];
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
