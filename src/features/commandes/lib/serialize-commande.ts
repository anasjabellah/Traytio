import type { Commande, CommandeItem, PaymentSummary } from '@/features/commandes/types'

function toNumber(value: unknown): number | null {
  if (value == null) return null
  return Number(value)
}

export function serializeCommande(c: {
  id: string; organizationId: string; clientId: string; eventId: string | null
  number: string; status: string; eventType: string | null; eventDate: Date | null
  guestCount: number | null; location: string | null; menuId: string | null; menuName: string | null
  pricePerPerson: unknown; totalAmount: unknown; acomptePercent: number
  acompteAmount: unknown; paidAmount: unknown; remainingAmount: unknown
  notes: string | null; transportFees: unknown; deliveryFees: unknown; equipmentFees: unknown
  discountType: string | null; discountValue: unknown; discountAmount: unknown
  taxRate: unknown; taxLabel: string | null; taxAmount: unknown; clientBudget: unknown
  contactName: string | null; contactPhone: string | null
  internalNotes: string | null; clientNotes: string | null
  pdfUrl: string | null; sentAt: Date | null; sentVia: string | null
  createdAt: Date; updatedAt: Date
  client?: { name: string | null; phone: string | null } | null
  event?: { name: string | null; status: string | null } | null
}): Commande {
  return {
    id: c.id, organizationId: c.organizationId, clientId: c.clientId, eventId: c.eventId,
    number: c.number, status: c.status, eventType: c.eventType, eventDate: c.eventDate,
    guestCount: c.guestCount, location: c.location, menuId: c.menuId, menuName: c.menuName,
    pricePerPerson: toNumber(c.pricePerPerson),
    totalAmount: Number(c.totalAmount ?? 0), acomptePercent: c.acomptePercent,
    acompteAmount: Number(c.acompteAmount ?? 0), paidAmount: Number(c.paidAmount ?? 0),
    remainingAmount: Number(c.remainingAmount ?? 0), notes: c.notes,
    transportFees: toNumber(c.transportFees), deliveryFees: toNumber(c.deliveryFees),
    equipmentFees: toNumber(c.equipmentFees),
    discountType: c.discountType, discountValue: toNumber(c.discountValue),
    discountAmount: toNumber(c.discountAmount),
    taxRate: toNumber(c.taxRate), taxLabel: c.taxLabel ?? null, taxAmount: toNumber(c.taxAmount),
    clientBudget: toNumber(c.clientBudget),
    contactName: c.contactName, contactPhone: c.contactPhone,
    internalNotes: c.internalNotes, clientNotes: c.clientNotes,
    pdfUrl: c.pdfUrl, sentAt: c.sentAt, sentVia: c.sentVia,
    createdAt: c.createdAt, updatedAt: c.updatedAt,
    clientName: c.client?.name ?? null, clientPhone: c.client?.phone ?? null,
    eventName: c.event?.name ?? null, eventStatus: c.event?.status ?? null,
  }
}

export function serializeCommandeItem(i: {
  id: string; commandeId: string; menuId: string | null
  name: string; quantity: number; unitPrice: unknown; totalPrice: unknown
  notes: string | null; menuItemId: string | null
}): CommandeItem {
  return {
    id: i.id, commandeId: i.commandeId, menuId: i.menuId,
    name: i.name, quantity: i.quantity,
    unitPrice: Number(i.unitPrice ?? 0), totalPrice: Number(i.totalPrice ?? 0),
    notes: i.notes, menuItemId: i.menuItemId,
  }
}

export function serializePaymentSummary(p: {
  id: string; amount: unknown; method: string; status: string
  reference: string | null; notes: string | null; createdAt: Date
}): PaymentSummary {
  return {
    id: p.id, amount: Number(p.amount ?? 0), method: p.method, status: p.status,
    reference: p.reference, notes: p.notes, createdAt: p.createdAt,
  }
}
