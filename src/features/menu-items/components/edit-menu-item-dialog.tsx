'use client';
import * as React from 'react';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { updateMenuItem } from '@/features/menu-items/actions/update-menu-item';
import { createMenuItemSchema } from '@/features/menu-items/validations/create-menu-item-schema';
import type { MenuItem } from '@/features/menu-items/types';
import { MenuItemForm } from './menu-item-form';
import { X } from 'lucide-react';

type Props = {
  item: MenuItem | null;
  open: boolean;
  onClose: (open: boolean) => void;
  onSuccess?: () => void;
};

type FormValues = z.input<typeof createMenuItemSchema>;

export function EditMenuItemDialog({ item, open, onClose, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createMenuItemSchema),
    defaultValues: item ? {
      name: item.name,
      category: item.category,
      unitPrice: Number(item.unitPrice),
      unit: item.unit ?? '',
      isActive: item.isActive,
      notes: item.notes ?? '',
      imageUrl: item.imageUrl ?? '',
    } as any : {
      name: '',
      unitPrice: undefined,
      unit: '',
      isActive: true,
      notes: '',
      imageUrl: '',
    } as any,
    mode: 'onTouched',
  });

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
      <DialogContent showCloseButton={false} className="flex flex-col p-0 gap-0 w-[95vw] max-w-[800px] !max-w-[800px] rounded-2xl border border-border shadow-xl overflow-hidden max-h-[90vh]">
        <FormProvider {...form}>
          {/* HEADER */}
          <DialogHeader className="px-8 pt-7 pb-5 border-b border-border shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="font-display text-3xl tracking-tight text-charcoal">
                  Modifier l'article
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1.5">
                  Modifiez les champs ci-dessous.
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => onClose(false)}
                className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </DialogHeader>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {item && (
              <MenuItemForm
                mode="edit"
                onSubmit={handleUpdate}
                isLoading={isSubmitting}
                onUploadingChange={setIsUploading}
              />
            )}
          </div>

          {/* FOOTER */}
          <div className="px-8 py-4 border-t border-border flex items-center justify-between shrink-0 bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-5 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="menu-item-form"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2.5 rounded-2xl bg-[var(--gold)] hover:brightness-90 active:brightness-75 text-white text-sm font-medium transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : 'Mettre à jour l\'article'}
            </button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
