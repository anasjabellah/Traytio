'use client';

import { useState } from 'react';
import { useForm, Controller, type Control, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  checkoutCustomerSchema,
  type CheckoutCustomerInput,
} from '@/features/billing/validations/checkout-customer-schema';
import { createChariPayCheckoutSession } from '@/features/billing/actions/charipay-checkout';
import type { PlanDetails } from '@/features/billing/lib/plans';

type FieldName = keyof CheckoutCustomerInput;

function Field({
  control,
  errors,
  name,
  label,
  ...inputProps
}: {
  control: Control<CheckoutCustomerInput>;
  errors: FieldErrors<CheckoutCustomerInput>;
  name: FieldName;
  label: string;
} & React.ComponentProps<typeof Input>) {
  const message = errors[name]?.message;
  const id = `checkout-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{label}</Label>
          <Input
            id={id}
            size="lg"
            aria-invalid={message ? true : undefined}
            aria-describedby={message ? `${id}-error` : undefined}
            {...inputProps}
            {...field}
          />
          {message && (
            <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
              {message}
            </p>
          )}
        </div>
      )}
    />
  );
}

export function CheckoutForm({ plan }: { plan: PlanDetails }) {
  const { control, handleSubmit, formState: { errors } } = useForm<CheckoutCustomerInput>({
    resolver: zodResolver(checkoutCustomerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '' },
    mode: 'onTouched',
  });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Real checkout: validate locally, create a ChariPay Sandbox payment
  // session server-side, then redirect to the hosted checkout. Returning a
  // checkoutUrl is NOT payment success — confirmation arrives via webhook
  // in a later phase, and nothing is provisioned here.
  async function onSubmit(values: CheckoutCustomerInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await createChariPayCheckoutSession({ plan: plan.id, customer: values });
      if (res.success && res.data?.checkoutUrl) {
        window.location.assign(res.data.checkoutUrl);
        return;
      }
      setServerError(res.error ?? 'Le paiement est momentanément indisponible. Réessayez.');
    } catch {
      setServerError('Le paiement est momentanément indisponible. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <h2 className="font-display text-2xl tracking-tight">Vos informations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ces informations seront liées à votre abonnement.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            control={control}
            errors={errors}
            name="firstName"
            label="Prénom"
            placeholder="Sara"
            autoComplete="given-name"
          />
          <Field
            control={control}
            errors={errors}
            name="lastName"
            label="Nom"
            placeholder="Bennani"
            autoComplete="family-name"
          />
        </div>
        <Field
          control={control}
          errors={errors}
          name="email"
          label="Email"
          type="email"
          placeholder="sara@exemple.com"
          autoComplete="email"
        />
        <Field
          control={control}
          errors={errors}
          name="phone"
          label="Téléphone"
          type="tel"
          placeholder="+212 6 12 34 56 78"
          autoComplete="tel"
        />

        <div className="rounded-2xl border border-border bg-surface-soft p-5">
          <h2 className="font-display text-2xl tracking-tight">Paiement</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paiement sécurisé via notre prestataire de paiement.
          </p>
          <div className="mt-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            En cliquant sur Payer, vous serez redirigé vers la page de paiement sécurisée de notre
            prestataire. Aucune donnée bancaire n&apos;est saisie sur ce site.
          </div>
        </div>

        <div className="rounded-2xl border border-border p-5 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-semibold">{plan.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Facturation</span>
            <span className="font-semibold">Mensuelle</span>
          </div>
          <div className="flex items-center justify-between text-base">
            <span className="font-semibold">Total aujourd&apos;hui</span>
            <span className="font-display text-2xl tracking-tight">
              {plan.priceMad.toLocaleString('fr-FR')} {plan.currency}
            </span>
          </div>
        </div>

        <Button type="submit" variant="gold" size="xl" className="w-full" disabled={submitting}>
          {submitting ? 'Redirection vers le paiement…' : `Payer ${plan.priceMad.toLocaleString('fr-FR')} ${plan.currency}`}
        </Button>

        {serverError && (
          <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Vous serez redirigé vers la page de paiement sécurisée. Aucun abonnement n&apos;est créé
          avant confirmation du paiement.
        </p>
      </form>
    </div>
  );
}
