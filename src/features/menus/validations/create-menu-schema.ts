import { z } from 'zod';
import { MENU } from '@/lib/notify/messages';

export const baseMenuSchema = z.object({
  name: z.string().min(2, { message: MENU.VALIDATION.NAME_MIN_LENGTH }),
  description: z.string().optional(),
  category: z.enum([
    'WEDDING',
    'CORPORATE',
    'BUFFET',
    'COCKTAIL',
    'BRUNCH',
    'DESSERT',
    'CUSTOM',
  ], { message: MENU.VALIDATION.CATEGORY_REQUIRED }),
  pricePerPerson: z.number({ message: MENU.VALIDATION.INVALID_NUMBER }).positive({ message: MENU.VALIDATION.PRICE_POSITIVE }),
  minPersons: z.number().int().positive().default(1),
  maxPersons: z.number({ message: MENU.VALIDATION.MAX_TABLES_REQUIRED }).int().positive({ message: MENU.VALIDATION.MAX_TABLES_REQUIRED }),
  isActive: z.boolean().default(true),
  menuItems: z.array(z.object({
    menuItemId: z.string().min(1),
    defaultQty: z.number().min(1).default(1),
  })).optional().default([]),
});

function capacityRefinement(data: { maxPersons?: number; minPersons?: number }, ctx: z.RefinementCtx) {
  if (data.maxPersons !== undefined && data.minPersons !== undefined && data.maxPersons < data.minPersons) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['maxPersons'],
      message: MENU.VALIDATION.MAX_TABLES_MIN_MAX,
    });
  }
}

export const createMenuSchema = baseMenuSchema.superRefine(capacityRefinement);

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
