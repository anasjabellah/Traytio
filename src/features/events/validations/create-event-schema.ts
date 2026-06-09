import { z } from 'zod';

const MIN_DURATION_MS = 30 * 60 * 1000;

export const validationErrorMap: z.core.$ZodErrorMap = (issue) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.received === 'undefined') return 'Ce champ est obligatoire.';
    if (issue.expected === 'date') return 'Veuillez sélectionner une date.';
    return 'Valeur invalide.';
  }
  if (issue.code === z.ZodIssueCode.invalid_value) {
    return "Veuillez sélectionner un type d'événement.";
  }
  return undefined;
};

export const createEventSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
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
      message: "La date de l'événement doit être aujourd'hui ou dans le futur.",
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
      message: "L'heure de fin doit être différente de l'heure de début.",
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
      message: 'La durée doit être d\'au moins 30 minutes.',
    });
  }
});

export type CreateEventInput = z.input<typeof createEventSchema>;
export type UpdateEventInput = Partial<CreateEventInput> & { id: string };
