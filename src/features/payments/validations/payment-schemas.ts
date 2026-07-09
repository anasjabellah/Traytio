import { z } from "zod";
import { PAYMENT } from "@/lib/notify/messages";

export const paymentMethodEnum = z.enum(["CASH", "CARD", "TRANSFER", "CHECK", "OTHER"]);

export const recordPaymentSchema = z.object({
  commandeId: z.string().min(1),
  amount: z.number().positive(PAYMENT.VALIDATION.AMOUNT_REQUIRED),
  method: paymentMethodEnum,
  date: z.string().min(1, PAYMENT.VALIDATION.DATE_REQUIRED),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
