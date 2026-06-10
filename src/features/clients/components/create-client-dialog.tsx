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
      <DialogContent className="flex flex-col p-0 gap-0 w-[90vw] max-w-[800px] !max-w-[800px] rounded-xl border border-[#e2e2e2] shadow-lg overflow-hidden max-h-[90vh]">
        {/* FIXED HEADER */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e2e2e2] shrink-0">
          <DialogTitle className="font-heading text-2xl font-medium text-[#1a1a1a]">Créer un client</DialogTitle>
          <div className="w-8 h-0.5 bg-[#C9A96E] mt-2 mb-1" />
          <DialogDescription className="text-sm text-[#888888]">
            Entrez les informations du client pour le créer dans le système.
          </DialogDescription>
        </DialogHeader>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ClientForm mode="create" onSubmit={handleCreate} isLoading={isSubmitting} />
        </div>

        {/* FIXED FOOTER */}
        <div className="px-6 py-4 border-t border-[#e2e2e2] flex items-center justify-end gap-3 shrink-0 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2 rounded-[0.75rem] border border-[#e2e2e2] text-[#888888] hover:text-[#1a1a1a] hover:border-[#1a0a1a] transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="client-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-[0.75rem] bg-[#C9A96E] hover:bg-[#b8975e] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Création...' : 'Créer le client'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
