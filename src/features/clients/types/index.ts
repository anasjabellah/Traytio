export type Client = {
  id: string;
  organizationId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  company?: string | null;
  siret?: string | null;
  notes?: string | null;
  totalSpent: string | number;
  lastOrderAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientCommande = {
  id: string;
  number: string;
  status: string;
  totalAmount: string | number;
  createdAt: Date;
};

export type ClientEvent = {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: Date;
};

export type ClientWithStats = Client & {
  commandesCount: number;
  eventsCount: number;
  commandes?: ClientCommande[];
  events?: ClientEvent[];
};

export type CreateClientInput = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  company?: string;
  siret?: string;
  notes?: string;
};

export type UpdateClientInput = Partial<CreateClientInput> & {
  id: string;
};

export type GetClientsParams = {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'totalSpent' | 'lastOrderAt';
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedClients = {
  data: ClientWithStats[];
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
