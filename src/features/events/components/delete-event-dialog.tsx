import * as React from 'react';
import { toast } from 'sonner';
import { deleteEvent } from '@/features/events/actions/delete-event';
import type { Event } from '@/features/events/types';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

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
        toast.success('Événement supprimé avec succès');
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(resp.error || "Erreur lors de la suppression de l'événement");
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur inattendue');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l'événement</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes‑vous sûr de vouloir supprimer l'événement <strong>{event.name}</strong> ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Suppression…' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
