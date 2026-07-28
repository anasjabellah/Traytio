import { z } from 'zod';
import { VALIDATION } from '@/lib/notify/messages';

export const demoRequestSchema = z.object({
  fullName: z.string().trim().min(1, { message: VALIDATION.NAME_REQUIRED }),
  companyName: z.string().trim().min(1, { message: "Nom de l'entreprise requis." }),
  email: z.string().email({ message: VALIDATION.INVALID_EMAIL }),
  phone: z.string().trim().min(1, { message: VALIDATION.PHONE_REQUIRED }),
  city: z.string().trim().min(1, { message: "Ville requise." }),
  country: z.string().trim().min(1, { message: "Pays requis." }),
  companySize: z.string().min(1, { message: VALIDATION.INVALID_SELECTION }),
  monthlyEvents: z.string().min(1, { message: VALIDATION.INVALID_SELECTION }),
  message: z.string().optional().or(z.literal('')),
  privacyAccepted: z.literal(true, { message: "Vous devez accepter la politique de confidentialité." }),
});

export type DemoRequestInput = z.input<typeof demoRequestSchema>;
