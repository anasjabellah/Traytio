'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { createMenuSchema } from '@/features/menus/validations/create-menu-schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_BADGE_COLORS } from '@/features/menus/constants';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

type MenuFormValues = z.input<typeof createMenuSchema>;

type MenuFormProps = {
  onSubmit: (values: MenuFormValues) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
};

const inputClass = "flex items-center gap-2 rounded-2xl border border-border bg-white px-4 h-12 transition-all focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/30";

const menuItemCategoryLabels: Record<string, string> = {
  FOOD: 'Aliment',
  DRINKS: 'Boisson',
  DESSERTS: 'Dessert',
  DECORATION: 'Décoration',
  STAFF: 'Personnel',
  ENTERTAINMENT: 'Divertissement',
  EXTRAS: 'Extras',
};

type AvailableItem = {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  unit: string | null;
  imageUrl: string | null;
};

export function MenuForm({ onSubmit, isLoading = false, mode }: MenuFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    register,
    watch,
  } = useFormContext<MenuFormValues>();

  const { fields, append, remove } = useFieldArray({ control, name: 'menuItems' });

  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemsLoading, setItemsLoading] = useState(true);

  useEffect(() => {
    async function loadItems() {
      try {
        const res = await fetch('/api/menu-items?limit=200');
        const json = await res.json();
        const list = (json?.data ?? json ?? []) as AvailableItem[];
        setAvailableItems(list.map((i: any) => ({ ...i, unitPrice: Number(i.unitPrice) })));
      } catch (e) {
        console.error('Failed to load menu items', e);
      } finally {
        setItemsLoading(false);
      }
    }
    loadItems();
  }, []);

  const usedItemIds = new Set(fields.map(f => f.menuItemId));
  const availableToAdd = availableItems.filter(i => !usedItemIds.has(i.id));

  const handleAddItem = () => {
    if (!selectedItemId) return;
    const item = availableItems.find(i => i.id === selectedItemId);
    if (!item) return;
    append({ menuItemId: item.id, defaultQty: 1 });
    setSelectedItemId('');
  };

  const groupedCategories = ['FOOD', 'DRINKS', 'DESSERTS', 'DECORATION', 'STAFF', 'ENTERTAINMENT', 'EXTRAS'];

  return (
    <form id="menu-form" onSubmit={handleSubmit(async v => await onSubmit(v))} className="space-y-5">
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
                placeholder="Nom du menu"
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
                const CatIcon = field.value ? CATEGORY_ICONS[field.value as keyof typeof CATEGORY_ICONS] : null;
                return (
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <SelectTrigger className="w-full text-sm px-4 py-0 gap-2 border border-border bg-white rounded-2xl !h-12 transition-all focus-visible:ring-1 focus-visible:ring-gold/30 focus-visible:border-gold">
                      {field.value ? (
                        <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', catColor)}>
                          {CatIcon && <CatIcon className="size-3.5 inline-block mr-1.5" />}
                          {currentLabel}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sélectionner une catégorie</span>
                      )}
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                        const color = CATEGORY_BADGE_COLORS[key as keyof typeof CATEGORY_BADGE_COLORS];
                        const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
                        return (
                          <SelectItem key={key} value={key}>
                            <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', color)}>
                              <Icon className="size-3.5 inline-block mr-1.5" />
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
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Prix par table (MAD) *</div>
            <div className={inputClass}>
              <span className="text-sm text-muted-foreground">MAD</span>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                {...register('pricePerPerson', { valueAsNumber: true })}
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {errors.pricePerPerson && <p className="text-xs text-red-600 mt-1">{errors.pricePerPerson.message?.toString()}</p>}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Min. tables</div>
            <div className={inputClass}>
              <input
                type="number"
                placeholder="1"
                {...register('minPersons', { valueAsNumber: true })}
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Max. tables</div>
            <div className={inputClass}>
              <input
                type="number"
                placeholder="Optionnel"
                {...register('maxPersons', { valueAsNumber: true })}
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="rounded-xl border border-border/60 bg-surface-soft p-5 space-y-4">
        <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground font-semibold">
          Description
        </h3>
        <textarea
          {...register('description')}
          placeholder="Description du menu..."
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

      {/* COMPOSITION DU MENU */}
      <div className="rounded-xl border border-border/60 bg-surface-soft p-5 space-y-4">
        <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground font-semibold">
          Composition du Menu
        </h3>

        {fields.length > 0 && (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const item = availableItems.find(i => i.id === field.menuItemId);
              return (
                <div key={field.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-3 border border-border rounded-xl bg-white">
                  <div className="flex items-start gap-3 md:items-center md:flex-1 md:min-w-0">
                    {item?.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-xs text-gray-400">
                        N/A
                      </div>
                    )}
                    <div className="flex-1 min-w-0 self-center md:self-auto">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{item?.name ?? field.menuItemId}</p>
                        {item && (
                          <Badge className="hidden md:inline-flex text-[10px] px-1.5 py-0 bg-gray-100 text-gray-700 shrink-0">
                            {menuItemCategoryLabels[item.category] || item.category}
                          </Badge>
                        )}
                      </div>
                      {item && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="md:hidden text-[10px] px-1.5 py-0 bg-gray-100 text-gray-700">
                            {menuItemCategoryLabels[item.category] || item.category}
                          </Badge>
                          <span className="hidden md:inline text-xs text-gray-500 whitespace-nowrap">
                            {formatCurrency(item.unitPrice)}
                            {item.unit ? ` / ${item.unit}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="md:hidden p-2 -m-1 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                      aria-label="Supprimer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 md:shrink-0">
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-xs text-gray-500 whitespace-nowrap">Qté</label>
                      <input
                        type="number"
                        min={1}
                        className="h-8 w-16 text-sm text-center px-1 rounded-lg border border-border"
                        {...register(`menuItems.${index}.defaultQty` as const, { valueAsNumber: true })}
                      />
                    </div>
                    {item && (
                      <span className="md:hidden text-xs text-gray-500 whitespace-nowrap">
                        {formatCurrency(item.unitPrice)}
                        {item.unit ? ` / ${item.unit}` : ''}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="hidden md:block p-1 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                    aria-label="Supprimer"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <select
              value={selectedItemId}
              onChange={e => setSelectedItemId(e.target.value)}
              className="min-h-12 text-sm px-4 border border-border bg-white w-full rounded-2xl font-normal appearance-none"
            >
              <option value="">-- Sélectionner un article --</option>
              {groupedCategories.map(cat => {
                const items = availableToAdd.filter(i => i.category === cat);
                if (items.length === 0) return null;
                return (
                  <optgroup key={cat} label={menuItemCategoryLabels[cat] || cat}>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {formatCurrency(item.unitPrice)}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            disabled={!selectedItemId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--gold)] hover:brightness-90 active:brightness-75 text-white text-sm font-medium disabled:opacity-50 transition-all shrink-0"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>

        {itemsLoading && <p className="text-sm text-gray-400">Chargement des articles...</p>}
      </div>
    </form>
  );
}
