import { z } from 'zod';
import { createMenuItemSchema } from '@/features/menu-items/validations/create-menu-item-schema';

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  id: z.string(),
});

export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;