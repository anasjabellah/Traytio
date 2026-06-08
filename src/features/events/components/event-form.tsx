import React, { useEffect, useState, useCallback, useRef } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, MapPin, Users, Wallet, Minus, Plus, Search, X, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createEventSchema } from '@/features/events/validations/create-event-schema';
import { AvailabilityCard } from '@/features/events/components/availability-card';
import { checkEventConflicts } from '@/features/events/actions/check-event-conflicts';
import type { ConflictEventInfo } from '@/features/events/actions/check-event-conflicts';

type EventFormValues = z.input<typeof createEventSchema>;

type EventFormProps = {
  defaultValues?: Partial<EventFormValues>;
  onSubmit: (values: EventFormValues) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  eventId?: string;
};

const EVENT_TYPE_KEYS = ['Mariage', 'Entreprise', 'Anniversaire', 'Cocktail', 'Gala', 'Privé'] as const;
type EventType = z.infer<typeof createEventSchema>['type'];
const EVENT_TYPE_MAP: Record<string, EventType> = {
  Mariage: 'WEDDING' as EventType, Entreprise: 'CORPORATE' as EventType, Anniversaire: 'BIRTHDAY' as EventType,
  Cocktail: 'ANNIVERSARY' as EventType, Gala: 'HOLIDAY' as EventType, Privé: 'OTHER' as EventType,
};

const STATUS_KEYS = ['DRAFT', 'PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', PLANNED: 'Planifié', CONFIRMED: 'Confirmé',
  IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé',
};

function splitDate(d?: Date): { dateStr: string; timeStr: string } {
  if (!d || isNaN(d.getTime())) return { dateStr: '', timeStr: '' };
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${d.getFullYear()}-${month}-${day}`;
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { dateStr, timeStr };
}

function joinDate(dateStr: string, timeStr: string): Date | undefined {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T${timeStr || '00:00'}:00`);
}

export function EventForm({ defaultValues = {}, onSubmit, isLoading = false, mode, eventId }: EventFormProps) {
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
  const typeVal = watch('type') as string | undefined;

  const { dateStr: startDateStr, timeStr: startTimeStr } = splitDate(startDateVal);
  const { timeStr: endTimeStr } = splitDate(endDateVal);

  const [clients, setClients] = useState<Array<{ label: string; value: string }>>([]);
  const [clientQuery, setClientQuery] = useState('');
  const [clientFocused, setClientFocused] = useState(false);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch('/api/clients');
        const json = await res.json();
        const list = (Array.isArray(json) ? json : []).map((c: any) => ({ label: c.name, value: c.id }));
        setClients(list);
      } catch (e) {
        console.error('Failed to load clients', e);
      }
    }
    loadClients();
  }, []);

  const selectedClient = clients.find(c => c.value === watch('clientId'));
  const filteredClients = clients.filter(c =>
    c.label.toLowerCase().includes(clientQuery.toLowerCase())
  );

  const [availability, setAvailability] = useState<{
    state: 'idle' | 'checking' | 'available' | 'noConflict' | 'conflict';
    conflictingEvents: ConflictEventInfo[];
    sameDayEvents: ConflictEventInfo[];
  }>({ state: 'idle', conflictingEvents: [], sameDayEvents: [] });

  const conflictCheckId = useRef(0);

  const checkConflicts = useCallback(async (sDate: string, sTime: string, eTime: string) => {
    const id = ++conflictCheckId.current;
    const newStart = joinDate(sDate, sTime);
    if (!newStart) return;
    const newEnd = joinDate(sDate, eTime || '23:59');
    setAvailability(prev => ({ ...prev, state: 'checking' }));
    const res = await checkEventConflicts(newStart, newEnd ?? null, eventId);
    if (id !== conflictCheckId.current) return;
    if (res.success && res.data) {
      setAvailability({
        state: res.data.hasConflict ? 'conflict' : res.data.sameDayCount > 0 ? 'noConflict' : 'available',
        conflictingEvents: res.data.conflictingEvents,
        sameDayEvents: res.data.sameDayEvents,
      });
    }
  }, [eventId]);

  useEffect(() => {
    if (!startDateStr) {
      setAvailability({ state: 'idle', conflictingEvents: [], sameDayEvents: [] });
      return;
    }
    const timer = setTimeout(() => checkConflicts(startDateStr, startTimeStr, endTimeStr), 300);
    return () => clearTimeout(timer);
  }, [startDateStr, startTimeStr, endTimeStr, checkConflicts]);

  return (
    <form id="event-form" onSubmit={handleSubmit(async (v) => await onSubmit(v))} className="space-y-6">
      {/* Header */}
      {/* <div className="flex items-center gap-4">
        <div className="h-9 w-9 rounded-xl bg-foreground text-primary-foreground flex items-center justify-center text-xs font-medium tabular-nums">
          02
        </div>
        <div>
          <h2 className="font-display text-2xl tracking-tight">Informations de l'événement</h2>
          <p className="text-sm text-muted-foreground">Tous les détails clés en un coup d'œil</p>
        </div>
      </div> */}

      {/* Row 1: Name + Type */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Nom de l'événement *</div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-soft px-4 py-3 transition-all focus-within:border-gold focus-within:ring-gold">
            <input
              {...register('name')}
              placeholder="Mariage Lambert"
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message?.toString()}</p>}
        </div>

        {/* Type pills */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Type d'événement *</div>
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-surface-soft p-1.5">
            {EVENT_TYPE_KEYS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setValue('type', EVENT_TYPE_MAP[label], { shouldValidate: true })}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  typeVal === EVENT_TYPE_MAP[label]
                    ? 'bg-foreground text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type.message?.toString()}</p>}
        </div>
      </div>

      {/* Row 2: Date + Heure début + Heure fin */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Date */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Date *</div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-soft px-4 py-3 transition-all focus-within:border-gold focus-within:ring-gold">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => {
                const joined = joinDate(e.target.value, startTimeStr);
                setValue('startDate', joined, { shouldValidate: !!e.target.value });
              }}
              className="flex-1 bg-transparent text-sm focus:outline-none [color-scheme:light]"
            />
          </div>
          {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate.message?.toString()}</p>}
        </div>

        {/* Heure début */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Début</div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-soft px-4 py-3 transition-all focus-within:border-gold focus-within:ring-gold">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="time"
              value={startTimeStr}
              onChange={(e) => {
                const joined = joinDate(startDateStr, e.target.value);
                setValue('startDate', joined, { shouldValidate: !!startDateStr });
              }}
              className="flex-1 bg-transparent text-sm focus:outline-none [color-scheme:light]"
            />
          </div>
        </div>

        {/* Heure fin */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Fin</div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-soft px-4 py-3 transition-all focus-within:border-gold focus-within:ring-gold">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="time"
              value={endTimeStr}
              onChange={(e) => {
                const joined = joinDate(startDateStr || new Date().toISOString().split('T')[0], e.target.value);
                setValue('endDate', joined, { shouldValidate: false });
              }}
              className="flex-1 bg-transparent text-sm focus:outline-none [color-scheme:light]"
            />
          </div>
        </div>
      </div>

      <AvailabilityCard
        state={availability.state}
        conflictingEvents={availability.conflictingEvents}
        sameDayEvents={availability.sameDayEvents}
      />

      {/* Lieu */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Lieu</div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-soft px-4 py-3 transition-all focus-within:border-gold focus-within:ring-gold">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            {...register('location')}
            placeholder="Adresse, salle, château…"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Row 4: Guests + Budget */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Guests counter */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Nombre d'invités</div>
          <Controller
            name="guestCount"
            control={control}
            render={({ field }) => {
              const val = field.value ?? 80;
              return (
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface-soft px-4 h-14">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => field.onChange(Math.max(1, val - 10))}
                      className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-display text-2xl font-semibold tabular-nums w-10 text-center">{val}</span>
                    <button
                      type="button"
                      onClick={() => field.onChange(val + 10)}
                      className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">pax</span>
                </div>
              );
            }}
          />
        </div>

        {/* Budget */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Budget client</div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-soft px-4 h-14 transition-all focus-within:border-gold focus-within:ring-gold">
            <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">MAD</span>
            <Controller
              name="budget"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Client search */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Client associé</div>
        <div className="relative">
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <>
                <div className={`flex items-center gap-2 rounded-2xl border bg-surface-soft px-4 py-3 transition-all ${clientFocused ? 'border-gold ring-gold' : 'border-border'}`}>
                  {field.value && selectedClient ? (
                    <>
                      <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-medium">
                        {selectedClient.label.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
                      </div>
                      <span className="flex-1 text-sm">{selectedClient.label}</span>
                      <button type="button" onClick={() => { field.onChange(null); setClientQuery(''); }} className="h-6 w-6 rounded-full hover:bg-secondary flex items-center justify-center">
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                      <input
                        value={clientQuery}
                        onChange={(e) => setClientQuery(e.target.value)}
                        onFocus={() => setClientFocused(true)}
                        onBlur={() => setTimeout(() => setClientFocused(false), 150)}
                        placeholder="Rechercher un client…"
                        className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                      />
                    </>
                  )}
                </div>
                {clientFocused && !field.value && filteredClients.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-2 rounded-2xl border border-border bg-card shadow-lift overflow-hidden">
                    {filteredClients.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onMouseDown={() => { field.onChange(c.value); setClientQuery(''); setClientFocused(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-soft transition-colors text-left"
                      >
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                          {c.label.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
                        </div>
                        <span className="text-sm">{c.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {clientFocused && !field.value && filteredClients.length === 0 && clientQuery && (
                  <div className="absolute z-10 left-0 right-0 mt-2 rounded-2xl border border-border bg-card shadow-lift overflow-hidden">
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">Aucun client trouvé</div>
                  </div>
                )}
              </>
            )}
          />
        </div>
      </div>

      {/* Contact Person */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Personne de contact</div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-soft px-4 h-14 transition-all focus-within:border-gold focus-within:ring-gold">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            {...register('contactPerson')}
            placeholder="Nom du contact"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Contact Phone */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Téléphone contact</div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-soft px-4 h-14 transition-all focus-within:border-gold focus-within:ring-gold">
          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            {...register('contactPhone')}
            placeholder="+212 6 XX XX XX XX"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Status pills */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Statut</div>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-surface-soft p-1.5">
              {STATUS_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => field.onChange(key)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                    (field.value || 'DRAFT') === key
                      ? 'bg-foreground text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {STATUS_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Notes */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Notes</div>
        <textarea
          {...register('notes')}
          placeholder="Détails logistiques, demandes spéciales…"
          className="w-full min-h-[110px] rounded-2xl border border-border bg-surface-soft px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none"
        />
      </div>

      {/* Edit mode footer buttons */}
      {mode === 'edit' && (
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => (document.querySelector('[data-cancel-btn]') as HTMLElement)?.click()}
            className="px-5 py-2 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Annuler
          </button>
          <Button type="submit" disabled={isLoading} className="rounded-full bg-foreground text-primary-foreground hover:shadow-gold transition-all px-6">
            {isLoading ? 'En cours...' : 'Mettre à jour'}
          </Button>
        </div>
      )}
    </form>
  );
}
