'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { createMenuSchema } from '@/features/menus/validations/create-menu-schema';
import { X, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'menuItems',
  });

  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemsLoading, setItemsLoading] = useState(true);

  useEffect(() => {
    async function loadItems() {
      try {
        const res = await fetch('/api/menu-items?limit=200');
        const json = await res.json();
        const list = (json?.data ?? json ?? []) as AvailableItem[];
        setAvailableItems(list.map((i: any) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
        })));
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
            <label className="block text-sm font-medium mb-1">Prix par personne (MAD) *</label>
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

      <section>
        <h3 className="font-[family-name:var(--font-finlandica)] text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold">
          Composition du Menu
        </h3>

        {fields.length > 0 && (
          <div className="space-y-3 mb-4">
            {fields.map((field, index) => {
              const item = availableItems.find(i => i.id === field.menuItemId);
              return (
                <div key={field.id} className="flex items-center gap-3 p-3 border border-[#e2e2e2] rounded-xl bg-white">
                  {item?.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-xs text-gray-400">
                      N/A
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item?.name ?? field.menuItemId}</p>
                    {item && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-700">
                          {menuItemCategoryLabels[item.category] || item.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatCurrency(item.unitPrice)}
                          {item.unit ? ` / ${item.unit}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs text-gray-500">Qté</label>
                    <Input
                      type="number"
                      min={1}
                      className="h-8 w-16 text-sm text-center px-1"
                      {...register(`menuItems.${index}.defaultQty` as const, { valueAsNumber: true })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors shrink-0"
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
              className="min-h-[44px] text-sm px-4 border border-[#e2e2e2] bg-white w-full rounded-[0.75rem] font-normal appearance-none"
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
            className="flex items-center gap-2 px-4 py-2 rounded-[0.75rem] bg-[#C9A96E] text-white text-sm font-medium hover:bg-[#b8975e] disabled:opacity-50 transition-colors shrink-0"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>

        {itemsLoading && <p className="text-sm text-gray-400 mt-2">Chargement des articles...</p>}
      </section>
    </form>
  );
}
