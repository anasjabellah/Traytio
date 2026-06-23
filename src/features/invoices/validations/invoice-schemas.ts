import { z } from "zod";

export const updateInvoiceStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "PAID", "OVERDUE"]),
});

export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
