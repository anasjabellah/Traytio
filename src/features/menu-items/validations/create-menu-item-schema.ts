import { z } from 'zod';

export const createMenuItemSchema = z.object({
  imageUrl: z.string().optional(),
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
 category: z.enum(['FOOD', 'DRINKS', 'DESSERTS', 'DECORATION', 'STAFF', 'ENTERTAINMENT', 'EXTRAS'] as const, { message: 'Veuillez sélectionner une catégorie' }),
  unitPrice: z.number({ message: 'Veuillez entrer un nombre valide' }).positive({ message: 'Le prix doit être supérieur à 0' }),
  unit: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;