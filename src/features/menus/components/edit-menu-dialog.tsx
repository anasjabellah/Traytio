import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MenuForm } from './menu-form';
import { updateMenu } from '@/features/menus/actions/update-menu';
import type { Menu } from '@/features/menus/types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
      const response = await updateMenu({ id: menu.id, ...values });
      if (response.success && response.data) {
        toast.success('Menu mis à jour avec succès');
        onSuccess?.();
        onClose(false);
      } else {
        toast.error(response.error || "Erreur lors de la mise à jour du menu");
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur inattendue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
        <DialogContent className="w-[90vw] max-w-[800px] !max-w-[800px] mx-auto rounded-xl border border-[#e2e2e2] shadow-lg p-6 max-h-[90vh] overflow-y-auto [&]:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-medium text-[#1a1a1a]">Modifier le menu</DialogTitle>
            <div className="w-8 h-0.5 bg-[#C9A96E] mt-2 mb-4" />
            <DialogDescription className="text-sm text-[#888888] mt-1">Modifiez les informations du menu ci‑dessous.</DialogDescription>
          </DialogHeader>
          {menu && (
            <MenuForm
              mode="edit"
              defaultValues={{
                ...menu,
                // Ensure fields match schema defaults as needed
              }}
              onSubmit={handleUpdate}
              isLoading={isSubmitting}
            />
          )}
          <DialogFooter className="hidden" />
          <button data-cancel-btn onClick={() => onClose(false)} disabled={isSubmitting} className="hidden" />
        </DialogContent>
      </motion.div>
    </Dialog>
  );
}
