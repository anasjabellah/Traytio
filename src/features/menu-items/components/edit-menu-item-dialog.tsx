'use client';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { updateMenuItem } from '@/features/menu-items/actions/update-menu-item';
import type { MenuItem } from '@/features/menu-items/types';
import { MenuItemForm } from './menu-item-form';

type Props = {
  item: MenuItem | null;
  open: boolean;
  onClose: (open: boolean) => void;
  onSuccess?: () => void;
};

export function EditMenuItemDialog({ item, open, onClose, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUpdate = async (values: any) => {
    if (!item) return;
    setIsSubmitting(true);
    try {
      const resp = await updateMenuItem({ id: item.id, ...values });
      if (resp.success) {
        toast.success('Article mis à jour');
        onSuccess?.();
        onClose(false);
      } else {
        toast.error(resp.error ?? 'Erreur mise à jour');
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur inattendue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex flex-col p-0 gap-0 w-[90vw]  max-w-[800px] !max-w-[800px] rounded-xl border border-[#e2e2e2] shadow-lg overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e2e2e2] shrink-0">
          <DialogTitle className="font-heading text-2xl font-medium text-[#1a1a1a]">
            Modifier l'article
          </DialogTitle>
          <div className="w-8 h-0.5 bg-[#C9A96E] mt-2 mb-1" />
          <DialogDescription className="text-sm text-[#888888]">
            Modifiez les champs ci‑dessous.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {item && (
            <MenuItemForm
              mode="edit"
              defaultValues={{
                ...item,
                unit: item.unit ?? undefined,
                notes: item.notes ?? undefined,
                imageUrl: item.imageUrl ?? undefined,
              }}
              onSubmit={handleUpdate}
              isLoading={isSubmitting}
              onUploadingChange={setIsUploading}
            />
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#e2e2e2] flex items-center justify-end gap-3 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="cursor-pointer hover:bg-gray-50 transition-colors px-5 py-2 rounded-[0.75rem] border border-[#e2e2e2] text-[#888888] hover:text-[#1a1a1a] transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="menu-item-form"
            disabled={isSubmitting || isUploading}
            className="cursor-pointer hover:bg-[#b8975e] transition-colors px-5 py-2 rounded-[0.75rem] bg-[#C9A96E] text-white text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}