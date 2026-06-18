import { z } from 'zod';

export const commandeItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  menuItemId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const createCommandeSchema = z.object({
  number: z.string().min(1),
  clientId: z.string().min(1),
  eventId: z.string().nullable().optional(),
  eventName: z.string().nullable().optional(),
  eventType: z.string().nullable().optional(),
  eventDate: z.string().nullable().optional(),
  guestCount: z.number().int().min(1).nullable().optional(),
  location: z.string().nullable().optional(),
  menuId: z.string().nullable().optional(),
  menuName: z.string().nullable().optional(),
  pricePerPerson: z.number().min(0).nullable().optional(),
  totalAmount: z.number().min(0).nullable().optional(),
  transportFees: z.number().min(0).nullable().optional(),
  deliveryFees: z.number().min(0).nullable().optional(),
  equipmentFees: z.number().min(0).nullable().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).nullable().optional(),
  discountValue: z.number().min(0).nullable().optional(),
  discountAmount: z.number().min(0).nullable().optional(),
  acomptePercent: z.number().int().min(0).max(100).nullable().optional(),
  acompteAmount: z.number().min(0).nullable().optional(),
  remainingAmount: z.number().min(0).nullable().optional(),
  clientBudget: z.number().min(0).nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  clientNotes: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED']).optional().default('DRAFT'),
  items: z.array(commandeItemSchema).optional().default([]),
});

export type CreateCommandeInput = z.infer<typeof createCommandeSchema>;
