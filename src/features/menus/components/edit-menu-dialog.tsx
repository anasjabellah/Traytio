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
import { updateMenu } from '@/features/menus/actions/update-menu';
import type { Menu } from '@/features/menus/types';
import { MenuForm } from './menu-form';

interface EditMenuDialogProps {
  menu: Menu | null;
  open: boolean;
  onClose: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditMenuDialog({ menu, open, onClose, onSuccess }: EditMenuDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleUpdate = async (values: any) => {
    if (!menu) return;
    setIsSubmitting(true);
    try {
      const resp = await updateMenu({ id: menu.id, ...values });
      if (resp.success) {
        toast.success('Menu mis à jour avec succès');
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
      <DialogContent className="flex flex-col p-0 gap-0 w-[90vw] max-w-[800px] !max-w-[800px] rounded-xl border border-[#e2e2e2] shadow-lg overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e2e2e2] shrink-0">
          <DialogTitle className="font-heading text-2xl font-medium text-[#1a1a1a]">
            Modifier le menu
          </DialogTitle>
          <div className="w-8 h-0.5 bg-[#C9A96E] mt-2 mb-1" />
          <DialogDescription className="text-sm text-[#888888]">
            Modifiez les champs ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {menu && (
            <MenuForm
              mode="edit"
              defaultValues={{
                ...menu,
                description: menu.description ?? undefined,
                maxPersons: menu.maxPersons ?? undefined,
              }}
              onSubmit={handleUpdate}
              isLoading={isSubmitting}
            />
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#e2e2e2] flex items-center justify-end gap-3 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="cursor-pointer hover:bg-gray-50 transition-colors px-5 py-2 rounded-[0.75rem] border border-[#e2e2e2] text-[#888888] hover:text-[#1a1a1a]"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="menu-form"
            disabled={isSubmitting}
            className="cursor-pointer hover:bg-[#b8975e] transition-colors px-5 py-2 rounded-[0.75rem] bg-[#C9A96E] text-white text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
