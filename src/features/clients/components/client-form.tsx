import React, { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, MapPin, MapPinHouse, Building, FileText } from 'lucide-react';
import { CLIENT } from "@/lib/notify/messages";
import { scrollToFirstError } from '@/lib/scroll-to-first-error';

const clientFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, { message: CLIENT.VALIDATION.NAME_REQUIRED }),
  email: z.string().email({ message: CLIENT.VALIDATION.EMAIL_INVALID }).optional().or(z.literal('')),
  phone: z.string().trim().min(1, { message: CLIENT.VALIDATION.PHONE_REQUIRED }),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  siret: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

type ClientFormProps = {
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (values: ClientFormValues) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  onValidityChange?: (isValid: boolean) => void;
};

export function ClientForm({ defaultValues = {}, onSubmit, isLoading = false, mode, onValidityChange }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    if (mode === 'edit' && defaultValues?.name) {
      reset(defaultValues);
    }
  }, [defaultValues?.name, reset]);

  const nameVal = watch('name');
  const phoneVal = watch('phone');

  useEffect(() => {
    const nameOk = (nameVal ?? '').trim().length > 0;
    const phoneOk = (phoneVal ?? '').trim().length > 0;
    onValidityChange?.(nameOk && phoneOk);
  }, [nameVal, phoneVal, onValidityChange]);

  const inputClass = "flex items-center gap-2 rounded-2xl border border-border bg-surface-soft px-4 py-3 transition-all focus-within:border-gold focus-within:ring-gold";
  const inputInnerClass = "flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground";
  const labelClass = "text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5";
  const sectionTitleClass = "text-[10px] uppercase tracking-[0.16em] text-foreground/50 font-semibold mb-3";

  function ErrorSlot({ error }: { error?: { message?: string } }) {
    return (
      <div className="min-h-[24px]">
        {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
      </div>
    );
  }

  return (
    <form id="client-form" onSubmit={handleSubmit(async (values) => {
      await onSubmit(values);
    }, (errs) => {
      scrollToFirstError(errs);
    })} className="space-y-6">

      {/* SECTION 1 — INFORMATIONS */}
      <div>
        <div className={sectionTitleClass}>Informations</div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div data-field="name">
            <div className={labelClass}>Nom *</div>
            <div className={inputClass}>
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <input {...register('name')} placeholder="Nom du client" className={inputInnerClass} />
            </div>
            <ErrorSlot error={errors.name} />
          </div>

          <div data-field="email">
            <div className={labelClass}>Email</div>
            <div className={inputClass}>
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <input {...register('email')} type="email" placeholder="client@example.com" className={inputInnerClass} />
            </div>
            <ErrorSlot error={errors.email} />
          </div>

          <div data-field="phone">
            <div className={labelClass}>Téléphone *</div>
            <div className={inputClass}>
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <input {...register('phone')} placeholder="+33 1 23 45 67 89" className={inputInnerClass} />
            </div>
            <ErrorSlot error={errors.phone} />
          </div>
        </div>
      </div>

      {/* SECTION 2 — ADRESSE */}
      <div>
        <div className={sectionTitleClass}>Adresse</div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div data-field="address">
            <div className={labelClass}>Rue</div>
            <div className={inputClass}>
              <MapPinHouse className="h-4 w-4 text-muted-foreground shrink-0" />
              <input {...register('address')} placeholder="123 Rue de la Paix" className={inputInnerClass} />
            </div>
            <ErrorSlot error={errors.address} />
          </div>

          <div data-field="city">
            <div className={labelClass}>Ville</div>
            <div className={inputClass}>
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <input {...register('city')} placeholder="Paris" className={inputInnerClass} />
            </div>
            <ErrorSlot error={errors.city} />
          </div>

          <div data-field="postalCode">
            <div className={labelClass}>Code postal</div>
            <div className={inputClass}>
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <input {...register('postalCode')} placeholder="75001" className={inputInnerClass} />
            </div>
            <ErrorSlot error={errors.postalCode} />
          </div>
        </div>
      </div>

      {/* SECTION 3 — ENTREPRISE */}
      <div>
        <div className={sectionTitleClass}>Entreprise</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div data-field="company">
            <div className={labelClass}>Nom de l'entreprise</div>
            <div className={inputClass}>
              <Building className="h-4 w-4 text-muted-foreground shrink-0" />
              <input {...register('company')} placeholder="Société XYZ" className={inputInnerClass} />
            </div>
            <ErrorSlot error={errors.company} />
          </div>

          <div data-field="siret">
            <div className={labelClass}>SIRET</div>
            <div className={inputClass}>
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <input {...register('siret')} placeholder="123 456 789 00012" className={inputInnerClass} />
            </div>
            <ErrorSlot error={errors.siret} />
          </div>
        </div>
      </div>

      {/* SECTION 4 — NOTES */}
      <div>
        <div className={sectionTitleClass}>Notes</div>
        <div data-field="notes">
          <textarea
            {...register('notes')}
            placeholder="Informations complémentaires..."
            className="w-full min-h-[120px] max-h-[140px] rounded-2xl border border-border bg-surface-soft px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none"
          />
          <ErrorSlot error={errors.notes} />
        </div>
      </div>
    </form>
  );
}
