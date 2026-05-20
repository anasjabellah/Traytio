import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ClientForm } from './client-form';
import { updateClient } from '@/features/clients/actions/update-client';
import type { Client } from '@/features/clients/types';
import { toast } from 'sonner';

type EditClientSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onSuccess?: (client: Client) => void;
};

export function EditClientSheet({ open, onOpenChange, client, onSuccess }: EditClientSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (values: any) => {
    setIsSubmitting(true);
    try {
      const response = await updateClient(client.id, values);
      if (response.success && response.data) {
        toast.success('Client mis à jour avec succès');
        onSuccess?.(response.data);
        onOpenChange(false);
      } else {
        toast.error(response.error || 'Erreur lors de la mise à jour du client');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur inattendue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Modifier le client</SheetTitle>
          <SheetDescription>Modifiez les informations du client ci‑dessous.</SheetDescription>
        </SheetHeader>
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
        <SheetFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
