import { z } from 'zod';
import { createMenuSchema } from './create-menu-schema';

export const updateMenuSchema = createMenuSchema.partial().extend({
  id: z.string(),
});

export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
