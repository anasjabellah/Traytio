import React, { useState } from 'react';
import { z } from 'zod';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createMenuItem } from '@/features/menu-items/actions/create-menu-item';
import { createMenuItemSchema } from '@/features/menu-items/validations/create-menu-item-schema';
import type { MenuItem } from '@/features/menu-items/types';
import { MenuItemForm } from './menu-item-form';
import { CATEGORY_LABELS, CATEGORY_BADGE_COLORS } from '@/features/menu-items/constants';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

type CreateMenuItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (item: MenuItem) => void;
};

type FormValues = z.input<typeof createMenuItemSchema>;

function LivePreview() {
  const [imageUrl, name, category, unitPrice, isActive] = useWatch<FormValues>({
    name: ['imageUrl', 'name', 'category', 'unitPrice', 'isActive'],
  }) as [string | undefined, string | undefined, string | undefined, number | undefined, boolean | undefined];

  const catLabel = category ? CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category : '';
  const catColor = category ? CATEGORY_BADGE_COLORS[category as keyof typeof CATEGORY_BADGE_COLORS] : '';

  return (
    <div className="sticky top-0 space-y-4">
      <div className="rounded-2xl border border-border/60 bg-surface-soft p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-3.5 w-3.5 text-[var(--gold-deep)]" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">Aperçu</span>
        </div>

        {imageUrl ? (
          <div className="mb-4 overflow-hidden rounded-xl border border-border">
            <img src={imageUrl} alt="" className="h-36 w-full object-cover object-center" />
          </div>
        ) : (
          <div className="mb-4 flex h-36 items-center justify-center rounded-xl border border-dashed border-border/60 bg-white">
            <span className="text-5xl opacity-30">📷</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Nom</span>
            <p className="font-display text-lg text-charcoal leading-tight mt-0.5">
              {name || 'Nom de l\'article'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Catégorie</span>
            <div className="mt-1">
              {catLabel ? (
                <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', catColor)}>
                  {catLabel}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Prix</span>
            <p className="font-display text-xl text-charcoal tabular-nums mt-0.5">
              {unitPrice ? formatCurrency(unitPrice) : '—'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Statut</span>
            <div className="mt-1">
              <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm', isActive !== false ? 'bg-emerald-600/85 text-white' : 'bg-zinc-500/70 text-white')}>
                {isActive !== false ? '● Actif' : '○ Inactif'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreateMenuItemDialog({ open, onOpenChange, onSuccess }: CreateMenuItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createMenuItemSchema),
    defaultValues: {
      name: '',
      unitPrice: undefined,
      unit: '',
      isActive: true,
      notes: '',
      imageUrl: '',
    } as any,
    mode: 'onTouched',
  });

  const handleCreate = async (values: any) => {
    setIsSubmitting(true);
    try {
      const resp = await createMenuItem(values);
      if (resp.success && resp.data) {
        toast.success('Article créé avec succès');
        onSuccess?.(resp.data);
        onOpenChange(false);
        form.reset();
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent showCloseButton={false} className="flex flex-col p-0 gap-0 w-[95vw] max-w-[1000px] !max-w-[1000px] rounded-2xl border border-border shadow-xl overflow-hidden max-h-[90vh]">
        <FormProvider {...form}>
          {/* HEADER */}
          <DialogHeader className="px-8 pt-7 pb-5 border-b border-border shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="font-display text-3xl tracking-tight text-charcoal">
                  Créer un article
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1.5">
                  Ajoutez un nouveau produit ou service au catalogue.
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => { form.reset(); onOpenChange(false); }}
                className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </DialogHeader>

          {/* CONTENT: Form + Preview */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="flex gap-8">
              <div className="flex-1 min-w-0">
                <MenuItemForm mode="create" onSubmit={handleCreate} isLoading={isSubmitting} />
              </div>
              <div className="hidden w-72 shrink-0 lg:block">
                <LivePreview />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-8 py-4 border-t border-border flex items-center justify-between shrink-0 bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <button
              type="button"
              onClick={() => { form.reset(); onOpenChange(false); }}
              className="px-5 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="menu-item-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-[var(--gold)] hover:brightness-90 active:brightness-75 text-white text-sm font-medium transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Création...' : "Créer l'article"}
            </button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
