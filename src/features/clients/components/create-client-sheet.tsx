import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ClientForm } from './client-form';
import { createClient } from '@/features/clients/actions/create-client';
import type { Client } from '@/features/clients/types';
import { toast } from 'sonner';

type CreateClientSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (client: Client) => void;
};

export function CreateClientSheet({ open, onOpenChange, onSuccess }: CreateClientSheetProps) {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Créer un nouveau client</SheetTitle>
          <SheetDescription>Entrez les informations du client pour le créer dans le système.</SheetDescription>
        </SheetHeader>
        <ClientForm mode="create" onSubmit={handleCreate} isLoading={isSubmitting} />
        <SheetFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
