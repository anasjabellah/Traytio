'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { deleteClient } from '@/features/clients/actions/delete-client';
import type { ClientWithStats } from '@/features/clients/types';
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

export function DeleteClientDialog({
  open,
  onOpenChange,
  client,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientWithStats;
  onSuccess?: () => void;
}) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const hasActiveCommandes = client.commandesCount > 0;

  const handleDelete = async () => {
    if (hasActiveCommandes) return; // safety guard
    setIsDeleting(true);
    try {
      const resp = await deleteClient(client.id);
      if (resp.success) {
        toast.success('Client supprimé avec succès');
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(resp.error || 'Erreur lors de la suppression du client');
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
          <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes‑vous sûr de vouloir supprimer le client{' '}
            <strong>{client.name}</strong>{' '}? Cette action est irréversible.
          </AlertDialogDescription>
          {hasActiveCommandes && (
            <p className="mt-2 text-sm text-destructive">
              Ce client possède des commandes actives et ne peut pas être supprimé.
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={hasActiveCommandes || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Suppression…' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
