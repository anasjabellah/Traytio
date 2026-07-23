'use client';

import * as React from 'react';
import { notify } from "@/lib/notify";
import { CLIENT } from "@/lib/notify/messages";
import { deleteClient } from '@/features/clients/actions/delete-client';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import type { ClientWithStats } from '@/features/clients/types';

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
    if (hasActiveCommandes) return;
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
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : CLIENT.DELETE.ERROR);
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
      title="Supprimer le client"
      description={
        <>
          Êtes-vous sûr de vouloir supprimer le client{' '}
          <span className="font-semibold text-foreground">{client.name}</span> ?
          {hasActiveCommandes && (
            <p className="mt-2 text-sm text-destructive">{CLIENT.ACTIVE_COMMANDES_WARNING}</p>
          )}
        </>
      }
      confirmLabel={hasActiveCommandes ? "Client avec commandes" : "Supprimer"}
    />
  );
}
