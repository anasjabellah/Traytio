"use client"

import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";
import { EventForm } from "@/features/events/components/event-form";
import {
  commandeEventDefaultValues,
  eventValuesToState,
  type EventWizardState,
} from "@/features/commandes/lib/event-form-adapter";

type EventStepProps = {
  eventName: string; setEventName: Dispatch<SetStateAction<string>>;
  eventType: string; setEventType: Dispatch<SetStateAction<string>>;
  eventDate: string; setEventDate: Dispatch<SetStateAction<string>>;
  startTime: string; setStartTime: Dispatch<SetStateAction<string>>;
  endTime: string; setEndTime: Dispatch<SetStateAction<string>>;
  location: string; setLocation: Dispatch<SetStateAction<string>>;
  guests: number; setGuests: Dispatch<SetStateAction<number>>;
  budget: number; setBudget: Dispatch<SetStateAction<number>>;
  eventStatus: string | null; setEventStatus: Dispatch<SetStateAction<string | null>>;
  contactPerson: string; setContactPerson: Dispatch<SetStateAction<string>>;
  contactPhone: string; setContactPhone: Dispatch<SetStateAction<string>>;
  eventNotes: string; setEventNotes: Dispatch<SetStateAction<string>>;
  clientId?: string | null;
  eventId?: string | null;
};

/**
 * Thin adapter that renders the SAME EventForm component used by the
 * Événement create/edit dialogs. It bridges EventForm's RHF form state to the
 * Commande wizard's hook state so every field the Commande mirrors on its
 * linked Event (name, type, status, dates, location, tables, budget, contacts,
 * notes) is placed, validated and edited identically to the Événement page.
 */
export function EventStep({
  eventName, setEventName, eventType, setEventType,
  eventDate, setEventDate, startTime, setStartTime, endTime, setEndTime,
  location, setLocation, guests, setGuests, budget, setBudget,
  eventStatus, setEventStatus, contactPerson, setContactPerson,
  contactPhone, setContactPhone, eventNotes, setEventNotes,
  clientId, eventId,
}: EventStepProps) {
  const wizardState = useMemo<EventWizardState>(() => ({
    eventName, eventType, eventDate, startTime, endTime,
    location, guests, budget, eventStatus, contactPerson, contactPhone, eventNotes,
  }), [eventName, eventType, eventDate, startTime, endTime, location, guests, budget, eventStatus, contactPerson, contactPhone, eventNotes]);

  const defaultValues = useMemo(
    () => commandeEventDefaultValues(wizardState, clientId),
    [wizardState, clientId],
  );

  const syncToState = useCallback((values: Partial<EventWizardState>) => {
    if (values.eventName !== undefined) setEventName(values.eventName);
    if (values.eventType !== undefined) setEventType(values.eventType);
    if (values.eventStatus !== undefined) setEventStatus(values.eventStatus);
    if (values.eventDate !== undefined) setEventDate(values.eventDate);
    if (values.startTime !== undefined) setStartTime(values.startTime);
    if (values.endTime !== undefined) setEndTime(values.endTime);
    if (values.location !== undefined) setLocation(values.location);
    if (values.guests !== undefined) setGuests(values.guests);
    if (values.budget !== undefined) setBudget(values.budget);
    if (values.contactPerson !== undefined) setContactPerson(values.contactPerson);
    if (values.contactPhone !== undefined) setContactPhone(values.contactPhone);
    if (values.eventNotes !== undefined) setEventNotes(values.eventNotes);
  }, [setEventName, setEventType, setEventStatus, setEventDate, setStartTime, setEndTime, setLocation, setGuests, setBudget, setContactPerson, setContactPhone, setEventNotes]);

  const handleValuesChange = useCallback((values: Parameters<typeof eventValuesToState>[0]) => {
    syncToState(eventValuesToState(values));
  }, [syncToState]);

  const handleSubmit = useCallback(async (values: Parameters<typeof eventValuesToState>[0]) => {
    syncToState(eventValuesToState(values));
  }, [syncToState]);

  return (
    <EventForm
      mode="create"
      eventId={eventId ?? undefined}
      defaultValues={defaultValues}
      onValuesChange={handleValuesChange}
      onSubmit={handleSubmit}
    />
  );
}
