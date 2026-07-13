'use client';

import { useState } from 'react';
import { deleteCommande } from '@/features/commandes/actions/delete-commande';
import { useInvalidateQueries } from '@/lib/invalidate-queries';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import type { Commande } from '@/features/commandes/types';

interface DeleteCommandeDialogProps {
  commande: Commande;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteCommandeDialog({ commande, open, onOpenChange, onSuccess }: DeleteCommandeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalidate = useInvalidateQueries();

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await deleteCommande(commande.id);
      if (resp.success) {
        invalidate([["dashboard"]]);
        onSuccess();
        onOpenChange(false);
      } else {
        setError(resp.error ?? 'Une erreur est survenue');
      }
    } catch (e: any) {
      setError(e.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      loading={loading}
      title="Supprimer la commande"
      description={
        <>
          Êtes-vous sûr de vouloir supprimer la commande{' '}
          <span className="font-semibold text-foreground">{commande.number}</span> ?
        </>
      }
      error={error}
    />
  );
}
