import { z } from 'zod';
import { createEventSchema } from './create-event-schema';

export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string()
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;