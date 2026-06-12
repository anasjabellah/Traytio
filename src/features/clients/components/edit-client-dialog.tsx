import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { updateClient } from '@/features/clients/actions/update-client';
import { getClientById } from '@/features/clients/actions/get-client-by-id';
import type { Client, ClientWithStats } from '@/features/clients/types';
import { ClientForm } from './client-form';

type EditClientDialogProps = {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function EditClientDialog({ client, open, onOpenChange, onSuccess }: EditClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullClient, setFullClient] = useState<ClientWithStats | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);

  const fetchClient = useCallback(async () => {
    if (!client?.id) return;
    setIsLoadingClient(true);
    try {
      const res = await getClientById(client.id);
      if (res.success && res.data) {
        console.log('[EditClientDialog] fetched client data:', res.data);
        setFullClient(res.data);
      }
    } catch {
      // fallback: use whatever was passed
    } finally {
      setIsLoadingClient(false);
    }
  }, [client?.id]);

  useEffect(() => {
    if (open && client?.id) {
      fetchClient();
    } else {
      setFullClient(null);
    }
  }, [open, client?.id, fetchClient]);

  const handleUpdate = async (values: any) => {
    setIsSubmitting(true);
    try {
      const response = await updateClient(client.id, values);
      if (response.success && response.data) {
        toast.success('Client mis à jour avec succès');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(response.error || "Erreur lors de la mise à jour du client");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur inattendue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultValues = useMemo(
    () => fullClient
      ? {
          id: fullClient.id,
          name: fullClient.name,
          email: fullClient.email ?? undefined,
          phone: fullClient.phone ?? undefined,
          address: fullClient.address ?? undefined,
          city: fullClient.city ?? undefined,
          postalCode: fullClient.postalCode ?? undefined,
          company: fullClient.company ?? undefined,
          siret: fullClient.siret ?? undefined,
          notes: fullClient.notes ?? undefined,
        }
      : undefined,
    [fullClient],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col p-0 gap-0 w-[90vw] max-w-[800px] !max-w-[800px] rounded-xl border border-[#e2e2e2] shadow-lg overflow-hidden max-h-[90vh]">
        {/* FIXED HEADER */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e2e2e2] shrink-0">
          <DialogTitle className="font-heading text-2xl font-medium text-[#1a1a1a]">Modifier le client</DialogTitle>
          <div className="w-8 h-0.5 bg-[#C9A96E] mt-2 mb-1" />
          <DialogDescription className="text-sm text-[#888888]">
            Modifiez les informations du client ci-dessous.
          </DialogDescription>
        </DialogHeader>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoadingClient || !defaultValues ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : (
            <ClientForm
              mode="edit"
              defaultValues={defaultValues}
              onSubmit={handleUpdate}
              isLoading={isSubmitting}
            />
          )}
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
            disabled={isSubmitting || isLoadingClient || !defaultValues}
            className="px-5 py-2 rounded-[0.75rem] bg-[#C9A96E] hover:bg-[#b8975e] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
