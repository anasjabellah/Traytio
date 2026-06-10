'use client';

import React from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createMenuItemSchema } from '@/features/menu-items/validations/create-menu-item-schema';
import { toast } from 'sonner';

type MenuItemFormValues = z.input<typeof createMenuItemSchema>;

type MenuItemFormProps = {
  defaultValues?: Partial<MenuItemFormValues>;
  onSubmit: (values: MenuItemFormValues) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  onUploadingChange?: (isUploading: boolean) => void;
};

const triggerClass = "min-h-[44px] text-sm px-4 border !border-[#e2e2e2] !bg-white w-full !rounded-[0.75rem] font-normal";

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: 'Food',
  DRINKS: 'Drinks',
  DESSERTS: 'Desserts',
  DECORATION: 'Decoration',
  STAFF: 'Services',
  ENTERTAINMENT: 'Divertissement',
  EXTRAS: 'Extras',
};

export function MenuItemForm({ defaultValues = {}, onSubmit, isLoading = false, mode, onUploadingChange }: MenuItemFormProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
    register,
    setValue,
    watch,
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(createMenuItemSchema),
    defaultValues,
    mode: 'onTouched',
  });
  const imageUrl = watch('imageUrl');

  return (
    <form id="menu-item-form" onSubmit={handleSubmit(async v => await onSubmit(v))} className="space-y-8">
      {/* INFORMATIONS */}
      <section>
        <h3 className="text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold font-[family-name:var(--font-finlandica)]">
          Informations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <Input placeholder="Nom de l'article" className="h-11 text-sm px-4" {...register('name')} />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message?.toString()}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie *</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => {
                const currentLabel = field.value ? CATEGORY_LABELS[field.value] || field.value : '';
                return (
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <SelectTrigger className={triggerClass}>
                      <span className="truncate">{currentLabel || 'Sélectionner une catégorie'}</span>
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
            {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category.message?.toString()}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prix unitaire (MAD) *</label>
            <Input type="number" step="0.01" placeholder="0" className="h-11 text-sm px-4" {...register('unitPrice', { valueAsNumber: true })} />
            {errors.unitPrice && <p className="text-sm text-red-600 mt-1">{errors.unitPrice.message?.toString()}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unité</label>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger className={triggerClass}>
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
      </section>

      {/* DESCRIPTION */}
      <section>
        <h3 className="text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold font-[family-name:var(--font-finlandica)]">
          Description
        </h3>
        <Textarea placeholder="Notes et description de l'article..." className="text-sm px-4 py-3" {...register('notes')} rows={4} />
      </section>

      {/* MEDIA */}
      <section>
        <h3 className="text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold font-[family-name:var(--font-finlandica)]">
          Media
        </h3>
        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
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
          }}
        />
        {isUploading && <p className="mt-2 text-sm text-gray-600">Téléchargement en cours...</p>}
        {imageUrl && (
          <img src={imageUrl} alt="Aperçu" className="mt-2 w-20 h-20 object-cover rounded-xl border border-border" />
        )}
      </section>

      {/* STATUT */}
      <section>
        <h3 className="text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold font-[family-name:var(--font-finlandica)]">
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
      </section>
    </form>
  );
}
