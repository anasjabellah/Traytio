import { z } from 'zod';
import { VALIDATION } from '@/lib/notify/messages';

export const demoRequestSchema = z.object({
  fullName: z.string().trim().min(1, { message: VALIDATION.NAME_REQUIRED }).max(100, { message: "Le nom est trop long." }),
  companyName: z.string().trim().min(1, { message: "Nom de l'entreprise requis." }).max(120, { message: "Le nom d'entreprise est trop long." }),
  email: z.string().trim().email({ message: VALIDATION.INVALID_EMAIL }).max(180, { message: "L'email est trop long." }),
  phone: z.string().trim().min(1, { message: VALIDATION.PHONE_REQUIRED }).max(30, { message: "Le numéro de téléphone est trop long." }),
  city: z.string().trim().min(1, { message: "Ville requise." }).max(80, { message: "La ville est trop longue." }),
  country: z.string().trim().min(1, { message: "Pays requis." }).max(80, { message: "Le pays est trop long." }),
  companySize: z.string().min(1, { message: VALIDATION.INVALID_SELECTION }).max(40, { message: VALIDATION.INVALID_SELECTION }),
  monthlyEvents: z.string().min(1, { message: VALIDATION.INVALID_SELECTION }).max(40, { message: VALIDATION.INVALID_SELECTION }),
  message: z.string().max(2000, { message: "Le message est trop long." }).optional().or(z.literal('')),
  privacyAccepted: z.literal(true, { message: "Vous devez accepter la politique de confidentialité." }),
});

export type DemoRequestInput = z.input<typeof demoRequestSchema>;
