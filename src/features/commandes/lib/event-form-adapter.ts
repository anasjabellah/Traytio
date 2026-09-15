import type { CreateEventInput } from '@/features/events/validations/create-event-schema';

export type EventWizardState = {
  eventName: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  guests: number;
  budget: number;
  eventStatus: string | null;
  contactPerson: string;
  contactPhone: string;
  eventNotes: string;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dateToTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function commandeEventDefaultValues(state: EventWizardState, clientId?: string | null): Partial<CreateEventInput> {
  return {
    name: state.eventName || undefined,
    type: (state.eventType || undefined) as CreateEventInput['type'],
    status: (state.eventStatus || undefined) as CreateEventInput['status'],
    startDate: state.eventDate && state.startTime ? new Date(`${state.eventDate}T${state.startTime}:00`) : undefined,
    endDate: state.eventDate && state.endTime ? new Date(`${state.eventDate}T${state.endTime}:00`) : undefined,
    location: state.location || undefined,
    guestCount: state.guests || 10,
    budget: state.budget || 0,
    contactPerson: state.contactPerson || undefined,
    contactPhone: state.contactPhone || undefined,
    notes: state.eventNotes || undefined,
    // clientId intentionally feeds the shared form's "Client associé" display
    // only — the Commande owns its client, server-side auto-created Events are
    // always linked to the Commande's client.
    clientId: clientId || undefined,
  };
}

export function eventValuesToState(values: Partial<CreateEventInput>): Partial<EventWizardState> {
  const next: Partial<EventWizardState> = {};
  if (typeof values.name === 'string') next.eventName = values.name;
  if (typeof values.type === 'string') next.eventType = values.type;
  if (typeof values.status === 'string') next.eventStatus = values.status;
  if (isValidDate(values.startDate)) {
    next.eventDate = dateToISO(values.startDate);
    next.startTime = dateToTime(values.startDate);
  }
  if (isValidDate(values.endDate)) next.endTime = dateToTime(values.endDate);
  if (typeof values.guestCount === 'number') next.guests = values.guestCount;
  if (typeof values.budget === 'number') next.budget = values.budget;
  if (typeof values.location === 'string') next.location = values.location;
  if (typeof values.contactPerson === 'string') next.contactPerson = values.contactPerson;
  if (typeof values.contactPhone === 'string') next.contactPhone = values.contactPhone;
  if (typeof values.notes === 'string') next.eventNotes = values.notes;
  return next;
}