import { z } from 'zod';
import { CLIENT } from "@/lib/notify/messages";

export const createClientSchema = z.object({
  name: z.string().trim().min(1, { message: CLIENT.VALIDATION.NAME_REQUIRED }),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().trim().min(1, { message: CLIENT.VALIDATION.PHONE_REQUIRED }),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  siret: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
