import { z } from 'zod';
import { VALIDATION } from '@/lib/notify/messages';

export const contactSchema = z.object({
  name: z.string().trim().min(1, { message: VALIDATION.NAME_REQUIRED }).max(100, { message: "Le nom est trop long." }),
  email: z.string().trim().email({ message: VALIDATION.INVALID_EMAIL }).max(180, { message: "L'email est trop long." }),
  message: z.string().trim().min(1, { message: "Veuillez écrire votre message." }).max(2000, { message: "Le message est trop long." }),
});

export type ContactInput = z.input<typeof contactSchema>;
