export type Commande = {
  id: string;
  organizationId: string;
  clientId: string;
  eventId: string | null;
  number: string;
  status: string;
  eventType: string | null;
  eventDate: Date | null;
  guestCount: number | null;
  location: string | null;
  menuId: string | null;
  menuName: string | null;
  pricePerPerson: number | null;
  totalAmount: number;
  acomptePercent: number;
  acompteAmount: number;
  paidAmount: number;
  remainingAmount: number;
  notes: string | null;
  transportFees: number | null;
  deliveryFees: number | null;
  equipmentFees: number | null;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number | null;
  taxRate: number | null;
  taxLabel: string | null;
  taxAmount: number | null;
  clientBudget: number | null;
  contactName: string | null;
  contactPhone: string | null;
  internalNotes: string | null;
  clientNotes: string | null;
  pdfUrl: string | null;
  sentAt: Date | null;
  sentVia: string | null;
  createdAt: Date;
  updatedAt: Date;
  clientName: string | null;
  clientPhone: string | null;
  eventName: string | null;
  eventStatus: string | null;
  items?: CommandeItem[];
};

export type CommandeItem = {
  id: string;
  commandeId: string;
  menuId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  menuItemId: string | null;
};

export type CommandeTask = {
  id: string;
  commandeId: string;
  title: string;
  isDone: boolean;
  dueDate: Date | null;
  createdAt: Date;
};

export type CommandeAttachment = {
  id: string;
  commandeId: string;
  name: string;
  url: string;
  type: string | null;
  createdAt: Date;
};

export type CommandeActivity = {
  id: string;
  commandeId: string;
  userId: string | null;
  action: string;
  description: string;
  createdAt: Date;
};

export type PaymentSummary = {
  id: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
};

export type CommandeWithDetails = Commande & {
  paymentStatus?: string;
  payments?: PaymentSummary[];
  client?: { id: string; name: string; email?: string | null; phone?: string | null } | null;
  event?: {
    id: string; name: string; type?: string | null; startDate?: Date | null; endDate?: Date | null; status?: string | null;
    guestCount?: number | null; location?: string | null; budget?: number | null;
    contactPerson?: string | null; contactPhone?: string | null; notes?: string | null;
  } | null;
  menu?: { id: string; name: string } | null;
  items?: CommandeItem[];
  tasks?: CommandeTask[];
  attachments?: CommandeAttachment[];
  activities?: CommandeActivity[];
};

export type CreateCommandeInput = {
  number: string;
  clientId: string;
  eventId?: string | null;
  eventName?: string | null;
  eventStatus?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  guestCount?: number | null;
  location?: string | null;
  menuId?: string | null;
  menuName?: string | null;
  pricePerPerson?: number | null;
  totalAmount?: number | null;
  notes?: string | null;
  status?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    menuItemId?: string | null;
  }>;
};

export type UpdateCommandeInput = Partial<CreateCommandeInput> & { id: string };

export type GetCommandesParams = {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  clientId?: string;
  eventId?: string;
};

export type PaginatedCommandes = {
  data: Commande[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type MenuItemDisplay = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  emoji?: string;
  tag?: string;
  imageUrl?: string;
};

// Used by existing mock-based form components
export type Client = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  vip?: boolean;
  events?: number;
  address?: string;
  notes?: string;
  _count?: { events: number };
};
