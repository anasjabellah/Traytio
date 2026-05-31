import { z } from 'zod';
import { createMenuSchema } from './create-menu-schema';

export const updateMenuSchema = createMenuSchema.partial();

export type UpdateMenuInput = z.infer<typeof updateMenuSchema> & { id: string };
