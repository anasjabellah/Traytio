'use client';

import React from 'react';
import { z } from 'zod';
import { useFormContext, Controller } from 'react-hook-form';
import { createMenuItemSchema } from '@/features/menu-items/validations/create-menu-item-schema';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CATEGORY_LABELS, CATEGORY_BADGE_COLORS } from '@/features/menu-items/constants';
import { toast } from 'sonner';
import { CloudUpload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type MenuItemFormValues = z.input<typeof createMenuItemSchema>;

type MenuItemFormProps = {
  onSubmit: (values: MenuItemFormValues) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  onUploadingChange?: (isUploading: boolean) => void;
};

const inputClass = "flex items-center gap-2 rounded-2xl border border-border bg-white px-4 h-12 transition-all focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/30";

export function MenuItemForm({ onSubmit, isLoading = false, mode, onUploadingChange }: MenuItemFormProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    register,
    setValue,
    watch,
  } = useFormContext<MenuItemFormValues>();

  const imageUrl = watch('imageUrl');

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      setValue('imageUrl', json.url);
      toast.success('Image téléchargée');
    } catch {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <form id="menu-item-form" onSubmit={handleSubmit(async v => await onSubmit(v))} className="space-y-5">
      {/* INFORMATIONS */}
      <div className="rounded-xl border border-border/60 bg-surface-soft p-5 space-y-4">
        <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground font-semibold">
          Informations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Nom *</div>
            <div className={inputClass}>
              <input
                {...register('name')}
                placeholder="Nom de l'article"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
              />
            </div>
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message?.toString()}</p>}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Catégorie *</div>
            <Controller
              name="category"
              control={control}
              render={({ field }) => {
                const currentLabel = field.value ? CATEGORY_LABELS[field.value as keyof typeof CATEGORY_LABELS] || field.value : '';
                const catColor = field.value ? CATEGORY_BADGE_COLORS[field.value as keyof typeof CATEGORY_BADGE_COLORS] : '';
                return (
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <SelectTrigger className="min-h-12 text-sm px-4 border border-border bg-white rounded-2xl !h-12">
                      {field.value ? (
                        <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', catColor)}>
                          {currentLabel}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sélectionner une catégorie</span>
                      )}
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                        const color = CATEGORY_BADGE_COLORS[key as keyof typeof CATEGORY_BADGE_COLORS];
                        return (
                          <SelectItem key={key} value={key}>
                            <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', color)}>
                              {label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                );
              }}
            />
            {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message?.toString()}</p>}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Prix unitaire (MAD) *</div>
            <div className={inputClass}>
              <span className="text-sm text-muted-foreground">MAD</span>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                {...register('unitPrice', { valueAsNumber: true })}
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {errors.unitPrice && <p className="text-xs text-red-600 mt-1">{errors.unitPrice.message?.toString()}</p>}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Unité</div>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger className="min-h-12 text-sm px-4 border border-border bg-white rounded-2xl !h-12 !text-muted-foreground">
                    <SelectValue placeholder="Sélectionner une unité" />
                  </SelectTrigger>
                  <SelectContent side="bottom">
                    <SelectItem value="pcs">pcs</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="portion">portion</SelectItem>
                    <SelectItem value="boîte">boîte</SelectItem>
                    <SelectItem value="sachet">sachet</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="rounded-xl border border-border/60 bg-surface-soft p-5 space-y-4">
        <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground font-semibold">
          Description
        </h3>
        <textarea
          {...register('notes')}
          placeholder="Notes et description de l'article..."
          className="w-full min-h-[100px] rounded-2xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none placeholder:text-muted-foreground"
        />
      </div>

      {/* STATUT */}
      <div className="rounded-xl border border-border/60 bg-surface-soft p-5 space-y-4">
        <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground font-semibold">
          Statut
        </h3>
        <div className="flex items-center gap-3">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
            )}
          />
          <span className="text-sm text-muted-foreground">{watch('isActive') !== false ? 'Actif' : 'Inactif'}</span>
        </div>
      </div>

      {/* MEDIA */}
      <div className="rounded-xl border border-border/60 bg-surface-soft p-5 space-y-4">
        <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground font-semibold">
          Média
        </h3>
        {imageUrl ? (
          <div className="relative inline-block">
            <img src={imageUrl} alt="Aperçu" className="h-40 w-full max-w-xs rounded-2xl border border-border object-cover object-center" />
            <button
              type="button"
              onClick={() => setValue('imageUrl', '')}
              className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all',
              dragOver ? 'border-gold bg-gold/5' : 'border-border/60 bg-white hover:border-gold/50 hover:bg-gold/5'
            )}
          >
            <CloudUpload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">Glissez votre image ici</p>
            <p className="text-xs text-muted-foreground mt-1">ou cliquez pour sélectionner</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await handleFileUpload(file);
                e.target.value = '';
              }}
            />
            {isUploading && <p className="mt-3 text-xs text-muted-foreground animate-pulse">Téléchargement en cours...</p>}
          </div>
        )}
      </div>
    </form>
  );
}
