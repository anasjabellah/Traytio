import { z } from 'zod';

// Customer identity for the SaaS checkout. Names/email/phone are trimmed;
// email is lowercased for stable reconciliation at provisioning time.
// Phone is required (business field, persisted with the billing record in a
// later phase) with light length validation only — no format enforcement yet.

export const checkoutCustomerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'Le prénom est requis.')
    .max(80, 'Le prénom est trop long (80 caractères maximum).'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Le nom est requis.')
    .max(80, 'Le nom est trop long (80 caractères maximum).'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "L'email est requis.")
    .email('Veuillez saisir une adresse email valide.')
    .max(160, "L'email est trop long (160 caractères maximum)."),
  phone: z
    .string()
    .trim()
    .min(1, 'Le téléphone est requis.')
    .min(6, 'Le numéro de téléphone semble incomplet.')
    .max(24, 'Le numéro de téléphone est trop long (24 caractères maximum).'),
});

export type CheckoutCustomerInput = z.infer<typeof checkoutCustomerSchema>;
