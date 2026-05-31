import { z } from 'zod';
import { MenuCategory } from '@/features/menus/types';

export const createMenuSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  category: z.enum([
    'WEDDING',
    'CORPORATE',
    'BUFFET',
    'COCKTAIL',
    'BRUNCH',
    'DESSERT',
    'CUSTOM',
  ]),
  pricePerPerson: z.number().positive(),
  minPersons: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
