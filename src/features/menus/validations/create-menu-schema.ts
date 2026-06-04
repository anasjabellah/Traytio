import { z } from 'zod';

export const createMenuSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  description: z.string().optional(),
  category: z.enum([
    'WEDDING',
    'CORPORATE',
    'BUFFET',
    'COCKTAIL',
    'BRUNCH',
    'DESSERT',
    'CUSTOM',
  ]),
  pricePerPerson: z.number({ message: 'Veuillez entrer un nombre valide' }).positive({ message: 'Le prix doit être supérieur à 0' }),
  minPersons: z.number().int().positive().default(1),
  maxPersons: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  menuItems: z.array(z.object({
    menuItemId: z.string().min(1),
    defaultQty: z.number().min(1).default(1),
  })).optional().default([]),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
