'use client';

import React from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
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

const triggerClass = "h-11 text-sm px-4 border border-input bg-background w-full rounded-[0.75rem]";

export function MenuForm({ defaultValues = {}, onSubmit, isLoading = false, mode }: MenuFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    register,
    setValue,
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
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <Input placeholder="Nom du menu" className="h-11 text-sm px-4" {...register('name')} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message?.toString()}</p>}
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie *</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger className={triggerClass}>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEDDING">Mariage</SelectItem>
                    <SelectItem value="CORPORATE">Entreprise</SelectItem>
                    <SelectItem value="BUFFET">Buffet</SelectItem>
                    <SelectItem value="COCKTAIL">Cocktail</SelectItem>
                    <SelectItem value="BRUNCH">Brunch</SelectItem>
                    <SelectItem value="DESSERT">Dessert</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-sm text-red-600">{errors.category.message?.toString()}</p>}
          </div>

          {/* Prix par personne */}
          <div>
            <label className="block text-sm font-medium mb-1">Prix par personne (€) *</label>
            <Input type="number" step="0.01" placeholder="0" className="h-11 text-sm px-4" {...register('pricePerPerson', { valueAsNumber: true })} />
            {errors.pricePerPerson && <p className="text-sm text-red-600">{errors.pricePerPerson.message?.toString()}</p>}
          </div>

          {/* Nombre minimum de personnes */}
          <div>
            <label className="block text-sm font-medium mb-1">Nb. min de personnes</label>
            <Input type="number" placeholder="1" className="h-11 text-sm px-4" {...register('minPersons', { valueAsNumber: true })} />
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
    </form>
  );
}
