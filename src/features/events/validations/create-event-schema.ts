import { z } from 'zod';
import { EVENT } from '@/lib/notify/messages';

const MIN_DURATION_MS = 30 * 60 * 1000;

export const validationErrorMap: z.core.$ZodErrorMap = (issue) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.received === 'undefined') return EVENT.VALIDATION.REQUIRED_FIELD;
    if (issue.expected === 'date') return EVENT.VALIDATION.INVALID_DATE;
    return EVENT.VALIDATION.INVALID_VALUE;
  }
  if (issue.code === z.ZodIssueCode.invalid_value) {
    return EVENT.VALIDATION.INVALID_TYPE;
  }
  return undefined;
};

export const createEventSchema = z.object({
  name: z.string().min(2, { message: EVENT.VALIDATION.NAME_MIN_LENGTH }),
  type: z.enum(['WEDDING', 'CORPORATE', 'BIRTHDAY', 'ANNIVERSARY', 'HOLIDAY', 'OTHER']),
  status: z.enum(['DRAFT', 'PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  location: z.string().optional(),
  guestCount: z.number().optional(),
  budget: z.number().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  clientId: z.string().optional(),
}).superRefine((data, ctx) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (data.startDate.getTime() < now.getTime()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startDate'],
      message: EVENT.VALIDATION.DATE_IN_PAST,
    });
  }

  const sh = data.startDate.getHours();
  const sm = data.startDate.getMinutes();
  const eh = data.endDate.getHours();
  const em = data.endDate.getMinutes();

  if (sh === eh && sm === em) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: EVENT.VALIDATION.SAME_START_END,
    });
    return;
  }

  let durationMs = data.endDate.getTime() - data.startDate.getTime();
  if (durationMs < 0) {
    durationMs += 24 * 60 * 60 * 1000;
  }
  if (durationMs < MIN_DURATION_MS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: EVENT.VALIDATION.MIN_DURATION,
    });
  }
});

export type CreateEventInput = z.input<typeof createEventSchema>;
export type UpdateEventInput = Partial<CreateEventInput> & { id: string };
