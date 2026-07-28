import { z } from "zod";
import { INVOICE } from "@/lib/notify/messages";

export const updateInvoiceStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "PAID", "OVERDUE"], { message: INVOICE.INVALID_STATUS }),
});

export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
