import { z } from 'zod';
import { MENU_ITEM } from '@/lib/notify/messages';

export const createMenuItemSchema = z.object({
  imageUrl: z.string().optional(),
  name: z.string().min(2, { message: MENU_ITEM.VALIDATION.NAME_MIN_LENGTH }),
  category: z.enum(['FOOD', 'DRINKS', 'DESSERTS', 'DECORATION', 'STAFF', 'ENTERTAINMENT', 'EXTRAS'] as const, { message: MENU_ITEM.VALIDATION.CATEGORY_REQUIRED }),
  unitPrice: z.number({ message: MENU_ITEM.VALIDATION.INVALID_PRICE }).positive({ message: MENU_ITEM.VALIDATION.PRICE_POSITIVE }),
  unit: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;