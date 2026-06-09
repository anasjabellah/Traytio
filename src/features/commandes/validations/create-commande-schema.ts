import { z } from 'zod';

export const commandeItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  menuItemId: z.string().nullable().optional(),
});

export const createCommandeSchema = z.object({
  number: z.string().min(1),
  clientId: z.string().min(1),
  eventType: z.string().nullable().optional(),
  eventDate: z.string().nullable().optional(),
  guestCount: z.number().int().min(1).nullable().optional(),
  location: z.string().nullable().optional(),
  menuId: z.string().nullable().optional(),
  menuName: z.string().nullable().optional(),
  pricePerPerson: z.number().min(0).nullable().optional(),
  totalAmount: z.number().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED']).optional().default('DRAFT'),
  items: z.array(commandeItemSchema).optional().default([]),
});

export type CreateCommandeInput = z.infer<typeof createCommandeSchema>;
