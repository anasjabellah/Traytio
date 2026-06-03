'use client';

import React from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createMenuSchema } from '@/features/menus/validations/create-menu-schema';

type MenuFormValues = z.input<typeof createMenuSchema>;

type MenuFormProps = {
  defaultValues?: Partial<MenuFormValues>;
  onSubmit: (values: MenuFormValues) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
};

const triggerClass = "min-h-[44px] text-sm px-4 border !border-[#e2e2e2] !bg-white w-full !rounded-[0.75rem] font-normal";

const categoryLabels: Record<string, string> = {
  WEDDING: 'Mariage',
  CORPORATE: 'Entreprise',
  BUFFET: 'Buffet',
  COCKTAIL: 'Cocktail',
  BRUNCH: 'Brunch',
  DESSERT: 'Dessert',
  CUSTOM: 'Custom',
};

export function MenuForm({ defaultValues = {}, onSubmit, isLoading = false, mode }: MenuFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    register,
  } = useForm<MenuFormValues>({
    resolver: zodResolver(createMenuSchema),
    defaultValues,
    mode: 'onTouched',
  });

  return (
    <form id="menu-form" onSubmit={handleSubmit(async (v) => await onSubmit(v))} className="space-y-8">
      <section>
        <h3 className="font-[family-name:var(--font-finlandica)] text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold">
          Informations de base
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <Input placeholder="Nom du menu" className="h-11 text-sm px-4" {...register('name')} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message?.toString()}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Catégorie *</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => {
                const currentLabel = field.value ? categoryLabels[field.value] || field.value : '';
                return (
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <SelectTrigger className={triggerClass} style={{ border: '1px solid #e2e2e2', borderRadius: '0.75rem', backgroundColor: 'white' }}>
                      <span className="truncate">{currentLabel || 'Sélectionner une catégorie'}</span>
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      <SelectItem value="WEDDING">Mariage</SelectItem>
                      <SelectItem value="CORPORATE">Entreprise</SelectItem>
                      <SelectItem value="BUFFET">Buffet</SelectItem>
                      <SelectItem value="COCKTAIL">Cocktail</SelectItem>
                      <SelectItem value="BRUNCH">Brunch</SelectItem>
                      <SelectItem value="DESSERT">Dessert</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                );
              }}
            />
            {errors.category && <p className="text-sm text-red-600">{errors.category.message?.toString()}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prix par personne (€) *</label>
            <Input type="number" step="0.01" placeholder="0" className="h-11 text-sm px-4" {...register('pricePerPerson', { valueAsNumber: true })} />
            {errors.pricePerPerson && <p className="text-sm text-red-600">{errors.pricePerPerson.message?.toString()}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nb. min de personnes</label>
            <Input type="number" placeholder="1" className="h-11 text-sm px-4" {...register('minPersons', { valueAsNumber: true })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nb. max de personnes</label>
            <Input type="number" placeholder="Optionnel" className="h-11 text-sm px-4" {...register('maxPersons', { valueAsNumber: true })} />
          </div>

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

      <section>
        <h3 className="font-[family-name:var(--font-finlandica)] text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold">
          Description
        </h3>
        <Textarea placeholder="Description du menu..." className="text-sm px-4 py-3" {...register('description')} rows={4} />
      </section>

    </form>
  );
}
