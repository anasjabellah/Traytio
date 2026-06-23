export type Invoice = {
  id: string;
  organizationId: string;
  commandeId: string | null;
  number: string;
  type: "DEVIS" | "FACTURE";
  status: "DRAFT" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "PAID" | "OVERDUE";
  issueDate: Date;
  dueDate: Date | null;
  totalAmount: number;
  paidAmount: number;
  notes: string | null;
  pdfUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InvoiceWithCommande = Invoice & {
  commande?: {
    id: string;
    number: string;
    status: string;
    totalAmount: number;
    acompteAmount: number;
    paidAmount: number;
    remainingAmount: number;
    transportFees: number | null;
    deliveryFees: number | null;
    equipmentFees: number | null;
    discountType: string | null;
    discountValue: number | null;
    discountAmount: number | null;
    notes: string | null;
    clientNotes: string | null;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      notes: string | null;
    }>;
    client?: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    } | null;
    event?: {
      name: string | null;
      startDate: Date | null;
      location: string | null;
    } | null;
  } | null;
};

export type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};
