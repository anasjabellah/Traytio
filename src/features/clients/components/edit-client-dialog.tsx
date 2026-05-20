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
        <DialogContent className="max-w-2xl w-full mx-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>Modifiez les informations du client ci‑dessous.</DialogDescription>
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
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <button
              onClick={() => {/* submit handled by form button inside ClientForm – no extra action */}}
              className="hidden"
            />
            {/* Close icon */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>
          </DialogFooter>
        </DialogContent>
      </motion.div>
    </Dialog>
  );
}
