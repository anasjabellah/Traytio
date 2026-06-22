import { z } from "zod";

export const paymentMethodEnum = z.enum(["CASH", "CARD", "TRANSFER", "CHECK", "OTHER"]);

export const recordPaymentSchema = z.object({
  commandeId: z.string().min(1),
  amount: z.number().positive("Le montant doit être supérieur à 0"),
  method: paymentMethodEnum,
  date: z.string().min(1, "La date est requise"),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
