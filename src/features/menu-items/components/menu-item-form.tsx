// src/features/menu-items/components/menu-item-form.tsx

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
      <section>
        <h3 className="font-[family-name:var(--font-finlandica)] text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold">
          Informations de base
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <Input placeholder="Nom de l'article" className="h-11 text-sm px-4" {...register('name')} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message?.toString()}</p>}
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie *</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => {
                const categoryLabels: Record<string, string> = {
                  FOOD: 'Aliment',
                  DRINKS: 'Boisson',
                  DESSERTS: 'Dessert',
                  DECORATION: 'Décoration',
                  STAFF: 'Personnel',
                  ENTERTAINMENT: 'Divertissement',
                  EXTRAS: 'Extras',
                };
                const currentLabel = field.value ? categoryLabels[field.value] || field.value : '';

                return (
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <SelectTrigger className={triggerClass} style={{ border: '1px solid #e2e2e2', borderRadius: '0.75rem', backgroundColor: 'white' }}>
                      <span className="truncate">{currentLabel || 'Sélectionner une catégorie'}</span>
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      <SelectItem value="FOOD">Aliment</SelectItem>
                      <SelectItem value="DRINKS">Boisson</SelectItem>
                      <SelectItem value="DESSERTS">Dessert</SelectItem>
                      <SelectItem value="DECORATION">Décoration</SelectItem>
                      <SelectItem value="STAFF">Personnel</SelectItem>
                      <SelectItem value="ENTERTAINMENT">Divertissement</SelectItem>
                      <SelectItem value="EXTRAS">Extras</SelectItem>
                    </SelectContent>
                  </Select>
                );
              }}
            />
            {errors.category && <p className="text-sm text-red-600">{errors.category.message?.toString()}</p>}
          </div>

          {/* Prix unitaire */}
          <div>
            <label className="block text-sm font-medium mb-1">Prix unitaire (MAD) *</label>
            <Input type="number" step="0.01" placeholder="0" className="h-11 text-sm px-4" {...register('unitPrice', { valueAsNumber: true })} />
            {errors.unitPrice && <p className="text-sm text-red-600">{errors.unitPrice.message?.toString()}</p>}
          </div>

          {/* Unité */}
          <div>
            <label className="block text-sm font-medium mb-1">Unité</label>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger className={triggerClass} style={{ border: '1px solid #e2e2e2', borderRadius: '0.75rem', backgroundColor: 'white' }}>
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

          {/* Actif */}
          <div className="flex items-center space-x-2">
            <label className="block text-sm font-medium mb-1">Actif</label>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="font-[family-name:var(--font-finlandica)] text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold">
          Notes
        </h3>
        <Textarea placeholder="Notes additionnelles..." className="text-sm px-4 py-3" {...register('notes')} rows={4} />
      </section>
    {/* Image Upload */}
    <section>
      <h3 className="font-[family-name:var(--font-finlandica)] text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold">
        Image
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
            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            if (!res.ok) throw new Error('Upload failed');
            const json = await res.json();
            setValue('imageUrl', json.url);
            toast.success('Image uploaded');
          } catch (err) {
            toast.error('Image upload error');
            console.error(err);
          } finally {
            setIsUploading(false);
          }
        }}
      />
      {isUploading && (
        <p className="mt-2 text-sm text-gray-600">Upload en cours...</p>
      )}
    {imageUrl && (
          <img src={imageUrl} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded" />
        )}
      </section>
    </form>
  );
}