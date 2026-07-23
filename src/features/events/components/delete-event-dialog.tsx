'use client';

import * as React from 'react';
import { notify } from '@/lib/notify';
import { EVENT } from '@/lib/notify/messages';
import { deleteEvent } from '@/features/events/actions/delete-event';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import type { Event } from '@/features/events/types';

type DeleteEventDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onSuccess?: () => void;
};

export function DeleteEventDialog({ open, onOpenChange, event, onSuccess }: DeleteEventDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const resp = await deleteEvent(event.id);
      if (resp.success) {
        notify.success(EVENT.DELETE.SUCCESS);
        onSuccess?.();
        onOpenChange(false);
      } else {
        notify.error(resp.error || EVENT.DELETE.ERROR);
      }
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : EVENT.UNEXPECTED_ERROR);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      loading={isDeleting}
      title="Supprimer l'événement"
      description={
        <>
          Êtes-vous sûr de vouloir supprimer l'événement{' '}
          <span className="font-semibold text-foreground">{event.name}</span> ?
        </>
      }
    />
  );
}
