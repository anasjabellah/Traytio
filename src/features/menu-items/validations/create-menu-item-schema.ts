import { z } from 'zod';
import type { MenuItemCategory } from '@/features/menu-items/types';

export const createMenuItemSchema = z.object({
  imageUrl: z.string().optional(),
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  category: z.enum([
    'FOOD',
    'DRINKS',
    'DESSERTS',
    'DECORATION',
    'STAFF',
    'ENTERTAINMENT',
    'EXTRAS',
  ]),
  unitPrice: z.number().positive(),
  unit: z.string().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;