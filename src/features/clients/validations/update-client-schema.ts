import { z } from 'zod';

export const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  siret: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;
