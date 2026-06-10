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
  unitPrice: number;
  unit?: string | null;
  isActive: boolean;
  notes?: string | null;
  imageUrl?: string | null;
  usageCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type MenuItemUsage = {
  times: number;
  revenue: number;
};

export type MenuItemWithUsage = MenuItem & {
  usage?: MenuItemUsage;
};

export type CreateMenuItemInput = {
  name: string;
  category: MenuItemCategory;
  unitPrice: number;
  unit?: string;
  isActive?: boolean;
  notes?: string;
  imageUrl?: string;
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
