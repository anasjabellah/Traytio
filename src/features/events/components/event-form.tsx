import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createEventSchema } from '@/features/events/validations/create-event-schema';

type EventFormValues = z.input<typeof createEventSchema>;

type EventFormProps = {
  defaultValues?: Partial<EventFormValues>;
  onSubmit: (values: EventFormValues) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
};

const triggerClass = "h-11 text-sm px-4 border border-input bg-background w-full rounded-[0.75rem]";

export function EventForm({ defaultValues = {}, onSubmit, isLoading = false, mode }: EventFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    register,
    setValue,
    watch,
  } = useForm<EventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const startDateVal = watch('startDate') as Date | undefined;
  const endDateVal = watch('endDate') as Date | undefined;

  const [clients, setClients] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch('/api/clients');
        const json = await res.json();
        const list = (Array.isArray(json) ? json : []).map((c: any) => ({
          label: c.name,
          value: c.id,
        }));
        setClients(list);
      } catch (e) {
        console.error('Failed to load clients', e);
      }
    }
    loadClients();
  }, []);

  return (
    <form id="event-form" onSubmit={handleSubmit(async (v) => await onSubmit(v))} className="space-y-8">
      <section>
        <h3 className="font-[family-name:var(--font-finlandica)] text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold">
          Informations de base
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <Input placeholder="Nom de l'événement" className="h-11 text-sm px-4" {...register('name')} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message?.toString()}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger className={triggerClass}>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEDDING">Mariage</SelectItem>
                    <SelectItem value="CORPORATE">Entreprise</SelectItem>
                    <SelectItem value="BIRTHDAY">Anniversaire</SelectItem>
                    <SelectItem value="ANNIVERSARY">Anniversaire de couple</SelectItem>
                    <SelectItem value="HOLIDAY">Fête</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-sm text-red-600">{errors.type.message?.toString()}</p>}
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium mb-1">Statut</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger className={triggerClass}>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Brouillon</SelectItem>
                    <SelectItem value="PLANNED">Planifié</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmé</SelectItem>
                    <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                    <SelectItem value="COMPLETED">Terminé</SelectItem>
                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Date de début */}
          <div>
            <label className="block text-sm font-medium mb-1">Date de début *</label>
            <Input
              type="date"
              className="h-11 text-sm px-4"
              value={startDateVal ? new Date(startDateVal).toISOString().split('T')[0] : ''}
              onChange={(e) => {
  if (e.target.value) {
    setValue('startDate', new Date(e.target.value + 'T00:00:00'), { shouldValidate: true });
  }
}}
            />
            {errors.startDate && <p className="text-sm text-red-600">{errors.startDate.message?.toString()}</p>}
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-sm font-medium mb-1">Date de fin</label>
            <Input
              type="date"
              className="h-11 text-sm px-4"
              value={endDateVal ? new Date(endDateVal).toISOString().split('T')[0] : ''}
              onChange={(e) => {
  if (e.target.value) {
    setValue('endDate', new Date(e.target.value + 'T00:00:00'), { shouldValidate: true });
  }
}}
            />
          </div>

          {/* Lieu */}
          <div>
            <label className="block text-sm font-medium mb-1">Lieu</label>
            <Input placeholder="Lieu de l'événement" className="h-11 text-sm px-4" {...register('location')} />
          </div>

          {/* Client associé */}
          <div>
            <label className="block text-sm font-medium mb-1">Client associé</label>
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => {
                const selectedClient = clients.find(c => c.value === field.value);
                return (
                  <Select
                    onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                    value={field.value ?? "none"}
                  >
                    <SelectTrigger className={triggerClass}>
                      <span className="text-sm">
                        {selectedClient ? selectedClient.label : "-- Aucun --"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Aucun --</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.value} value={client.value}>
                          {client.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
          </div>

          {/* Nombre d'invités */}
          <div>
            <label className="block text-sm font-medium mb-1">Nombre d'invités</label>
            <Input type="number" placeholder="0" className="h-11 text-sm px-4" {...register('guestCount', { valueAsNumber: true })} />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium mb-1">Budget (MAD)</label>
            <Input type="number" placeholder="0" className="h-11 text-sm px-4" {...register('budget', { valueAsNumber: true })} />
          </div>

        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="font-[family-name:var(--font-finlandica)] text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold">
          Notes
        </h3>
        <Textarea placeholder="Informations complémentaires..." rows={4} className="text-sm px-4 py-3" {...register('notes')} />
      </section>

      {mode === 'edit' && (
        <div className="flex justify-end items-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => (document.querySelector('[data-cancel-btn]') as HTMLElement)?.click()}
            className="px-5 py-2 rounded-[0.75rem] border border-[#e2e2e3] text-[#888888] hover:text-[#1a1a1a] transition-colors"
          >
            Annuler
          </button>
          <Button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'En cours...' : 'Mettre à jour'}
          </Button>
        </div>
      )}
    </form>
  );
}