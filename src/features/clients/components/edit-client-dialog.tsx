import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { notify } from "@/lib/notify";
import { NOTIFY } from "@/lib/messages";
import { updateClient } from '@/features/clients/actions/update-client';
import type { Client } from '@/features/clients/types';
import type { UpdateClientInput } from '@/features/clients/validations/update-client-schema';
import { ClientForm } from './client-form';

type EditClientDialogProps = {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function EditClientDialog({ client, open, onOpenChange, onSuccess }: EditClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = useMemo(
    () => ({
      id: client.id,
      name: client.name,
      email: client.email ?? undefined,
      phone: client.phone ?? undefined,
      address: client.address ?? undefined,
      city: client.city ?? undefined,
      postalCode: client.postalCode ?? undefined,
      company: client.company ?? undefined,
      siret: client.siret ?? undefined,
      notes: client.notes ?? undefined,
    }),
    [client.id, client.name, client.email, client.phone, client.address, client.city, client.postalCode, client.company, client.siret, client.notes],
  );

  const handleUpdate = async (values: UpdateClientInput) => {
    setIsSubmitting(true);
    try {
      const response = await updateClient(client.id, values);
      if (response.success && response.data) {
        notify.success(NOTIFY.CLIENT.UPDATE.SUCCESS);
        onSuccess();
        onOpenChange(false);
      } else {
        notify.error(response.error || NOTIFY.CLIENT.UPDATE.ERROR);
      }
    } catch (err) {
      notify.error(err instanceof Error ? err.message : NOTIFY.CLIENT.UPDATE.ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <ClientForm
            mode="edit"
            defaultValues={defaultValues}
            onSubmit={handleUpdate}
            isLoading={isSubmitting}
          />
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
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
