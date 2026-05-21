// Edit client dialog – mirrors create-client-dialog styling
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClientForm } from './client-form';
import { updateClient } from '@/features/clients/actions/update-client';
import type { Client } from '@/features/clients/types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface EditClientDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; // refresh list after successful update
}

export function EditClientDialog({ client, open, onOpenChange, onSuccess }: EditClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Animate entrance */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <DialogContent className="w-[90vw] max-w-[800px] !max-w-[800px] mx-auto rounded-xl border border-[#e2e2e2] shadow-lg p-6 max-h-[90vh] overflow-y-auto [&]:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-medium text-[#1a1a1a]">Modifier le client</DialogTitle>
            <div className="w-8 h-0.5 bg-[#C9A96E] mt-2 mb-4" />
            <DialogDescription className="text-sm text-[#888888] mt-1">Modifiez les informations du client ci‑dessous.</DialogDescription>
          </DialogHeader>
          <ClientForm
            mode="edit"
            defaultValues={{
              ...client,
              email: client.email ?? undefined,
              phone: client.phone ?? undefined,
              address: client.address ?? undefined,
              city: client.city ?? undefined,
              postalCode: client.postalCode ?? undefined,
              company: client.company ?? undefined,
              siret: client.siret ?? undefined,
              notes: client.notes ?? undefined,
            }}
            onSubmit={handleUpdate}
            isLoading={isSubmitting}
          />
<DialogFooter className="hidden" />
          <button
            data-cancel-btn
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="hidden"
          >
            Annuler
          </button>
        </DialogContent>
      </motion.div>
    </Dialog>
  );
}
