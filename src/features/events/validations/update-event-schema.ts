import { z } from 'zod';
import { EVENT } from '@/lib/notify/messages';

export const updateEventSchema = z.object({
  id: z.string(),
  name: z.string().min(2, { message: EVENT.VALIDATION.NAME_MIN_LENGTH }).optional(),
  type: z.enum(['WEDDING', 'CORPORATE', 'BIRTHDAY', 'ANNIVERSARY', 'HOLIDAY', 'OTHER']).optional(),
  status: z.enum(['DRAFT', 'PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  location: z.string().optional(),
  guestCount: z.number().optional(),
  budget: z.number().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  clientId: z.string().optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;