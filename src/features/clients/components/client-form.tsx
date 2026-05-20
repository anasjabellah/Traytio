import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// Schema defined locally (no external validation imports)
// No external Client type needed in this form

// Local schema for client form (create/update)
const clientFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  email: z.string().email({ message: 'Email invalide' }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  siret: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type ClientClientFormValues = z.infer<typeof clientFormSchema>;

type ClientFormProps = {
  defaultValues?: Partial<ClientClientFormValues>;
  onSubmit: (values: ClientClientFormValues) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
};

export function ClientForm({ defaultValues = {}, onSubmit, isLoading = false, mode }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const onSubmitHandler = async (values: ClientClientFormValues) => {
    await onSubmit(values);
  };

  return (
    <form id="client-form" onSubmit={handleSubmit(onSubmitHandler)} className="space-y-8">
      {/* Informations */}
      <section>
        <h3 className="font-[family-name:var(--font-finlandica)] text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold">Informations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <Input placeholder="Nom du client" className="h-11 text-sm px-4" {...register('name')} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message?.toString()}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input placeholder="client@example.com" type="email" className="h-11 text-sm px-4" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message?.toString()}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <Input placeholder="+33 1 23 45 67 89" className="h-11 text-sm px-4" {...register('phone')} />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone.message?.toString()}</p>}
          </div>
        </div>
      </section>

      {/* Adresse */}
      <section>
        <h3 className="font-[family-name:var(--font-finlandica)] text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold">Adresse</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Rue</label>
            <Input placeholder="123 Rue de la Paix" className="h-11 text-sm px-4" {...register('address')} />
            {errors.address && <p className="text-sm text-red-600">{errors.address.message?.toString()}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ville</label>
            <Input placeholder="Paris" className="h-11 text-sm px-4" {...register('city')} />
            {errors.city && <p className="text-sm text-red-600">{errors.city.message?.toString()}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code postal</label>
            <Input placeholder="75001" className="h-11 text-sm px-4" {...register('postalCode')} />
            {errors.postalCode && <p className="text-sm text-red-600">{errors.postalCode.message?.toString()}</p>}
          </div>
        </div>
      </section>

      {/* Entreprise */}
      <section>
        <h3 className="font-[family-name:var(--font-finlandica)] text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold">Entreprise</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom de l'entreprise</label>
            <Input placeholder="Société XYZ" className="h-11 text-sm px-4" {...register('company')} />
            {errors.company && <p className="text-sm text-red-600">{errors.company.message?.toString()}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SIRET</label>
            <Input placeholder="123 456 789 00012" className="h-11 text-sm px-4" {...register('siret')} />
            {errors.siret && <p className="text-sm text-red-600">{errors.siret.message?.toString()}</p>}
          </div>
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="font-[family-name:var(--font-finlandica)] text-xs uppercase tracking-[0.15em] text-foreground/70 mb-3 font-semibold">Notes</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <Textarea placeholder="Informations complémentaires..." rows={4} className="text-sm px-4 py-3" {...register('notes')} />
          {errors.notes && <p className="text-sm text-red-600">{errors.notes.message?.toString()}</p>}
        </div>
      </section>

      {mode === 'edit' && (
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                En cours...
              </span>
            ) : 'Mettre à jour'}
          </Button>
        </div>
      )}
    </form>
  );
}
