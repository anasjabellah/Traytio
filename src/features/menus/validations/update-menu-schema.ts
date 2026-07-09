import { z } from 'zod';
import { MENU } from '@/lib/notify/messages';
import { baseMenuSchema } from './create-menu-schema';

function capacityRefinement(data: { maxPersons?: number; minPersons?: number }, ctx: z.RefinementCtx) {
  if (data.maxPersons !== undefined && data.minPersons !== undefined && data.maxPersons < data.minPersons) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['maxPersons'],
      message: MENU.VALIDATION.MAX_TABLES_MIN_MAX,
    });
  }
}

export const updateMenuSchema = baseMenuSchema
  .partial()
  .extend({ id: z.string() })
  .superRefine(capacityRefinement);

export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
