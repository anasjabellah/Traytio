import { z } from 'zod';
export const createEventSchema = z.object({
  name: z.string().min(2, {
    message: 'Le nom doit contenir au moins 2 caráctères'
  }),
  type: z.enum([
    'WEDDING',
    'CORPORATE',
    'BIRTHDAY',
    'ANNIVERSARY',
    'HOLIDAY',
    'OTHER'
  ]),
  status: z.enum([
    'DRAFT',
    'PLANNED',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  ]).default('DRAFT'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  location: z.string().optional(),
  guestCount: z.number().optional(),
  budget: z.number().optional(),
  notes: z.string().optional(),
  clientId: z.string().optional()
});
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = Partial<CreateEventInput> & { id: string };