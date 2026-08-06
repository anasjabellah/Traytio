import { z } from 'zod';
import { VALIDATION } from '@/lib/notify/messages';

export const contactSchema = z.object({
  name: z.string().trim().min(1, { message: VALIDATION.NAME_REQUIRED }),
  email: z.string().email({ message: VALIDATION.INVALID_EMAIL }),
  message: z.string().trim().min(1, { message: "Veuillez écrire votre message." }),
});

export type ContactInput = z.input<typeof contactSchema>;
