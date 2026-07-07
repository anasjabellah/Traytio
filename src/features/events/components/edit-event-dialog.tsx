import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { updateEvent } from '@/features/events/actions/update-event';
import type { Event } from '@/features/events/types';
import { EventForm } from './event-form';

interface EditEventDialogProps {
  event: Event | null;
  open: boolean;
  onClose: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditEventDialog({ event, open, onClose, onSuccess }: EditEventDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (values: any) => {
    if (!event) return;
    setIsSubmitting(true);
    try {
      const response = await updateEvent({ id: event.id, ...values });
      if (response.success && response.data) {
        toast.success('Événement mis à jour avec succès');
        onSuccess?.();
        onClose(false);
      } else {
        toast.error(response.error || "Erreur lors de la mise à jour de l'événement");
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur inattendue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex flex-col p-0 gap-0 w-[90vw] max-w-[800px] !max-w-[800px] rounded-xl border border-[#e2e2e2] shadow-lg overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e2e2e2] shrink-0">
          <DialogTitle className="font-heading text-2xl font-medium text-[#1a1a1a]">Modifier l'événement</DialogTitle>
          <div className="w-8 h-0.5 bg-[#C9A96E] mt-2 mb-1" />
          <DialogDescription className="text-sm text-[#888888]">
            Modifiez les informations de l'événement ci-dessous.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {event && (
            <EventForm
              mode="create"
              eventId={event.id}
              defaultValues={{
                ...event,
                startDate: event.startDate ? new Date(event.startDate) : undefined,
                endDate: event.endDate ? new Date(event.endDate) : undefined,
                location: event.location ?? undefined,
                clientId: event.clientId ?? undefined,
                guestCount: event.guestCount ?? undefined,
                budget: event.budget ?? undefined,
                contactPerson: event.contactPerson ?? undefined,
                contactPhone: event.contactPhone ?? undefined,
                notes: event.notes ?? undefined,
              }}
              onSubmit={handleUpdate}
              isLoading={isSubmitting}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#e2e2e2] flex items-center justify-end gap-3 shrink-0 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-5 py-2 rounded-[0.75rem] border border-[#e2e2e2] text-[#888888] hover:text-[#1a1a1a] hover:border-[#1a0a1a] transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="event-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-[0.75rem] bg-[#C9A96E] hover:bg-[#b8975e] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
