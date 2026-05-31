// src/features/menu-items/components/create-menu-item-dialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createMenuItem } from '@/features/menu-items/actions/create-menu-item';
import type { MenuItem } from '@/features/menu-items/types';
import { MenuItemForm } from './menu-item-form';

type CreateMenuItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (item: MenuItem) => void;
};

export function CreateMenuItemDialog({ open, onOpenChange, onSuccess }: CreateMenuItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (values: any) => {
    setIsSubmitting(true);
    try {
      const resp = await createMenuItem(values);
      if (resp.success && resp.data) {
        toast.success('Article créé avec succès');
        onSuccess?.(resp.data);
        onOpenChange(false);
      } else {
        toast.error(resp.error || 'Erreur lors de la création de l\'article');
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur inattendue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col p-0 gap-0 w-[90vw] max-w-[800px] !max-w-[800px] rounded-xl border border-[#e2e2e2] shadow-lg overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e2e2e2] shrink-0">
          <DialogTitle className="font-heading text-2xl font-medium text-[#1a1a1a]">Créer un article</DialogTitle>
          <div className="w-8 h-0.5 bg-[#C9A96E] mt-2 mb-1" />
          <DialogDescription className="text-sm text-[#888888]">
            Entrez les informations de l'article pour le créer dans le système.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <MenuItemForm mode="create" onSubmit={handleCreate} isLoading={isSubmitting} />
        </div>
        <div className="px-6 py-4 border-t border-[#e2e2e2] flex items-center justify-end gap-3 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2 rounded-[0.75rem] border border-[#e2e2e2] text-[#888888] hover:text-[#1a1a1a] transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="menu-item-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-[0.75rem] bg-[#C9A96E] hover:bg-[#b8975e] text-white text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Création...' : 'Créer l\'article'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
