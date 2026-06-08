// Edit event dialog – mirrors create-event-dialog styling
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EventForm } from './event-form';
import { updateEvent } from '@/features/events/actions/update-event';
import type { Event } from '@/features/events/types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
        <DialogContent className="w-[90vw] max-w-[800px] !max-w-[800px] mx-auto rounded-xl border border-[#e2e2e2] shadow-lg p-6 max-h-[90vh] overflow-y-auto [&]:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-medium text-[#1a1a1a]">Modifier l'événement</DialogTitle>
            <div className="w-8 h-0.5 bg-[#C9A96E] mt-2 mb-4" />
            <DialogDescription className="text-sm text-[#888888] mt-1">Modifiez les informations de l'événement ci‑dessous.</DialogDescription>
          </DialogHeader>
          {event && (console.log("CURRENT EVENT ID", event.id), null)}
          {event && (
            <EventForm
              mode="edit"
              eventId={event.id}
              defaultValues={{
                ...event,
                // Ensure dates are Date objects (EventForm will handle formatting)
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
          <DialogFooter className="hidden" />
          <button data-cancel-btn onClick={() => onClose(false)} disabled={isSubmitting} className="hidden" />
        </DialogContent>
      </motion.div>
    </Dialog>
  );
}
