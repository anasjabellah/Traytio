'use client';

import * as React from 'react';
import { notify } from "@/lib/notify";
import { CLIENT } from "@/lib/notify/messages";
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
        notify.success(CLIENT.DELETE.SUCCESS);
        onSuccess?.();
        onOpenChange(false);
      } else {
        notify.error(resp.error || CLIENT.DELETE.ERROR);
      }
    } catch (e: any) {
      notify.error(e.message ?? CLIENT.DELETE.ERROR);
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
              {CLIENT.ACTIVE_COMMANDES_WARNING}
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
