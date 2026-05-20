// Rewritten dialog component with fixed header, scrollable content, and fixed footer
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createClient } from '@/features/clients/actions/create-client';
import type { Client } from '@/features/clients/types';
import { ClientForm } from './client-form';

type CreateClientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (client: Client) => void;
};

export function CreateClientDialog({ open, onOpenChange, onSuccess }: CreateClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (values: any) => {
    setIsSubmitting(true);
    try {
      const response = await createClient(values);
      if (response.success && response.data) {
        toast.success('Client créé avec succès');
        onSuccess?.(response.data);
        onOpenChange(false);
      } else {
        toast.error(response.error || 'Erreur lors de la création du client');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur inattendue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col p-0 gap-0 rounded-2xl border border-amber-100 overflow-hidden"
        style={{ maxHeight: '85vh', width: '90vw', maxWidth: '800px' }}
      >
        {/* FIXED HEADER */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-muted shrink-0">
          <DialogTitle className="text-sm font-semibold uppercase tracking-widest">
            Créer le client
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Entrez les informations du client pour le créer dans le système.
          </DialogDescription>
        </DialogHeader>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ClientForm mode="create" onSubmit={handleCreate} isLoading={isSubmitting} />
        </div>

        {/* FIXED FOOTER */}
        <div className="px-6 py-4 border-t border-muted flex items-center justify-between shrink-0 bg-background">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="client-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Création...' : 'Créer le client'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
