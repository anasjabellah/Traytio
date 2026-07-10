import React, { useEffect, useState, useCallback, useRef } from 'react';
import { z } from 'zod';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, MapPin, Wallet, Minus, Plus, Search, X, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createEventSchema, validationErrorMap } from '@/features/events/validations/create-event-schema';
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
    formState: { errors, isValid },
    register,
    setValue,
  } = useForm<EventFormValues>({
    resolver: zodResolver(createEventSchema, { error: validationErrorMap }),
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const startDateVal = useWatch({ control, name: 'startDate' }) as Date | undefined;
  const endDateVal = useWatch({ control, name: 'endDate' }) as Date | undefined;
  const typeVal = useWatch({ control, name: 'type' }) as string | undefined;

  const { dateStr: startDateStr, timeStr: startTimeStr } = splitDate(startDateVal);
  const { timeStr: endTimeStr } = splitDate(endDateVal);
  const todayStr = new Date().toISOString().slice(0, 10);

  const durationLabel = React.useMemo(() => {
    if (!startDateVal || !endDateVal) return null;
    let ms = endDateVal.getTime() - startDateVal.getTime();
    if (ms < 0) ms += 24 * 60 * 60 * 1000;
    if (ms < 60000) return null;
    const hours = Math.floor(ms / 3600000);
    const mins = Math.round((ms % 3600000) / 60000);
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  }, [startDateVal, endDateVal]);

  const [clients, setClients] = useState<Array<{ label: string; value: string }>>([]);
  const [clientQuery, setClientQuery] = useState('');
  const [clientFocused, setClientFocused] = useState(false);
  const clientDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadClients = useCallback(async (search?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('limit', '50');
      const res = await fetch(`/api/clients?${params}`);
      const json = await res.json();
      const list = (Array.isArray(json) ? json : json.data ?? []).map((c: any) => ({ label: c.name, value: c.id }));
      setClients(list);
    } catch (e) {
      console.error('Failed to load clients', e);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    return () => {
      if (clientDebounceRef.current) clearTimeout(clientDebounceRef.current);
      if (conflictTimerRef.current) clearTimeout(conflictTimerRef.current);
    };
  }, []);

  const handleClientInputChange = useCallback((value: string) => {
    setClientQuery(value);
    if (clientDebounceRef.current) clearTimeout(clientDebounceRef.current);
    clientDebounceRef.current = setTimeout(() => {
      loadClients(value || undefined);
    }, 300);
  }, [loadClients]);

  const currentClientId = useWatch({ control, name: 'clientId' });
  const selectedClient = clients.find(c => c.value === currentClientId);
  const filteredClients = clients;

  const [availability, setAvailability] = useState<{
    state: 'idle' | 'checking' | 'available' | 'noConflict' | 'conflict';
    conflictingEvents: ConflictEventInfo[];
    sameDayEvents: ConflictEventInfo[];
  }>({ state: 'idle', conflictingEvents: [], sameDayEvents: [] });

  const conflictCheckId = useRef(0);
  const conflictTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedKeyRef = useRef('');

  const checkConflicts = useCallback(async (sDate: string, sTime: string, eTime: string) => {
    const key = `${sDate}|${sTime}|${eTime}`;
    if (key === lastCheckedKeyRef.current) return;
    lastCheckedKeyRef.current = key;

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
    if (conflictTimerRef.current) clearTimeout(conflictTimerRef.current);
    conflictTimerRef.current = setTimeout(() => checkConflicts(startDateStr, startTimeStr, endTimeStr), 600);
    return () => {
      if (conflictTimerRef.current) clearTimeout(conflictTimerRef.current);
    };
  }, [startDateStr, startTimeStr, endTimeStr, checkConflicts]);

  return (
    <form id="event-form" onSubmit={handleSubmit(async (v) => {
      const values = v as unknown as { startDate?: Date | null; endDate?: Date | null };
      const adjusted = { ...v } as EventFormValues;
      if (values.endDate && values.startDate) {
        const e = values.endDate;
        const s = values.startDate;
        const eh = e.getHours(), em = e.getMinutes();
        const sh = s.getHours(), sm = s.getMinutes();
        if (eh < sh || (eh === sh && em < sm)) {
          e.setDate(e.getDate() + 1);
          adjusted.endDate = e;
        }
      }
      await onSubmit(adjusted);
    }, (errs) => {
      setTimeout(() => {
        const keys = Object.keys(errs);
        if (keys.length > 0) {
          const el = document.querySelector(`[data-field="${keys[0]}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (el.querySelector('input, button, textarea') as HTMLElement)?.focus();
          }
        }
      }, 100);
    })} className="space-y-6">
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
          {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type.message?.toString()}</p>}
        </div>
      </div>

      {/* Row 2: Date + Heure début + Heure fin */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Date */}
        <div data-field="startDate">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Date *</div>
          <div className={`flex items-center gap-2 rounded-2xl border bg-surface-soft px-4 py-3 transition-all focus-within:border-gold focus-within:ring-gold ${errors.startDate ? 'border-red-500' : 'border-border'}`}>
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="date"
              min={todayStr}
              value={startDateStr}
              onChange={(e) => {
                const nd = e.target.value;
                const joined = joinDate(nd, startTimeStr);
                setValue('startDate', joined, { shouldValidate: !!nd });
                if (endDateVal) {
                  const { timeStr: et } = splitDate(endDateVal);
                  setValue('endDate', joinDate(nd, et || '23:59'), { shouldValidate: true });
                }
              }}
              className="flex-1 bg-transparent text-sm focus:outline-none [color-scheme:light]"
            />
          </div>
          {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate.message?.toString()}</p>}
        </div>

        {/* Heure début */}
        <div data-field="startDate">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Début *</div>
          <div className={`flex items-center gap-2 rounded-2xl border bg-surface-soft px-4 py-3 transition-all focus-within:border-gold focus-within:ring-gold ${errors.startDate ? 'border-red-500' : 'border-border'}`}>
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
        <div data-field="endDate">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Fin *</div>
          <div className={`flex items-center gap-2 rounded-2xl border bg-surface-soft px-4 py-3 transition-all focus-within:border-gold focus-within:ring-gold ${errors.endDate ? 'border-red-500' : 'border-border'}`}>
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="time"
              value={endTimeStr}
              onChange={(e) => {
                if (!startDateStr) return;
                const joined = joinDate(startDateStr, e.target.value);
                setValue('endDate', joined, { shouldValidate: true });
              }}
              className="flex-1 bg-transparent text-sm focus:outline-none [color-scheme:light]"
            />
          </div>
          {errors.endDate && <p className="text-xs text-red-600 mt-1">{errors.endDate.message?.toString()}</p>}
          {durationLabel && !errors.endDate && (
            <p className="text-xs text-emerald-600 mt-1">Durée : {durationLabel}</p>
          )}
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
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Nombre de tables</div>
          <Controller
            name="guestCount"
            control={control}
            render={({ field }) => {
              const val = field.value ?? 80;
              return (
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface-soft px-4 h-14">
                  <TableIcon className="size-4 text-muted-foreground shrink-0" />
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
                  <span className="text-xs text-muted-foreground">tables</span>
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
                      <button type="button" onClick={() => { field.onChange(null); setClientQuery(''); loadClients(); }} className="h-6 w-6 rounded-full hover:bg-secondary flex items-center justify-center">
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                      <input
                        value={clientQuery}
                        onChange={(e) => handleClientInputChange(e.target.value)}
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
                        onMouseDown={() => { if (clientDebounceRef.current) clearTimeout(clientDebounceRef.current); field.onChange(c.value); setClientQuery(''); setClientFocused(false); }}
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
          <Button type="submit" disabled={isLoading || !isValid} className="rounded-full bg-foreground text-primary-foreground hover:shadow-gold transition-all px-6 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'En cours...' : 'Mettre à jour'}
          </Button>
        </div>
      )}
    </form>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 491.413 491.413" fill="currentColor" className={className}>
      <path d="M491.413,133.867c0-62.4-126.613-96.107-245.653-96.107S0,71.467,0,133.867c0,60.48,118.72,93.973,234.453,96v125.76c-0.213,0.747-0.533,1.387-0.853,2.133c-4.587,0.32-8.533,3.52-9.6,8.107c-1.173,4.16-2.773,8.107-4.8,11.947c-1.067,0.533-2.24,0.853-3.413,1.067c-12.373,1.6-30.08-17.707-36.693-27.307c-3.307-4.907-10.027-6.08-14.827-2.773s-6.08,10.027-2.773,14.827c2.347,3.413,20.373,29.013,42.987,35.2c-13.013,14.08-34.027,28.373-67.84,33.6c-5.867,0.853-9.813,6.293-8.96,12.16c0.747,5.227,5.333,9.067,10.56,9.067c0.533,0,1.067,0,1.6-0.107c56.853-8.64,83.733-39.68,95.787-61.227c3.627-3.093,6.827-6.613,9.387-10.667c2.56,3.947,5.76,7.573,9.387,10.667c12.16,21.547,39.04,52.587,95.893,61.227c0.533,0.107,1.067,0.107,1.6,0.107c5.867,0,10.667-4.8,10.667-10.667c0-5.333-3.84-9.813-9.067-10.56c-33.92-5.227-55.04-19.52-67.947-33.6c22.613-6.293,40.747-31.893,43.093-35.307c3.307-4.8,2.133-11.52-2.667-14.827s-11.52-2.133-14.827,2.773c-6.72,9.6-24.213,28.907-36.693,27.307c-1.173-0.213-2.347-0.533-3.413-1.067c-2.027-3.84-3.627-7.787-4.8-11.947c-1.173-4.587-5.12-7.787-9.707-8.107c-5.44-0.32-9.067-0.533-10.56-2.133v-125.76C372.693,227.84,491.413,194.347,491.413,133.867z M245.76,211.733c-113.173,0-192.853-31.04-204.8-77.867c11.947-46.827,91.627-77.867,204.8-77.867s192.853,31.04,204.8,77.867C438.613,180.693,358.933,211.733,245.76,211.733z" />
    </svg>
  );
}
