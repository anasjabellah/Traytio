"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { ArrowRight, Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/notify"

import { demoRequestSchema, type DemoRequestInput } from "../validations/demo-request-schema"
import { submitDemoRequest } from "../actions/submit-demo-request"
import { COMPANY_SIZES, MONTHLY_EVENTS } from "../constants"

type DemoFormProps = {
  onSuccess: () => void
}

type FieldProps = {
  id: string
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}

function Field({ id, label, error, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function DemoForm({ onSuccess }: DemoFormProps) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<DemoRequestInput>({
    resolver: zodResolver(demoRequestSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      companyName: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      companySize: "",
      monthlyEvents: "",
      message: "",
    },
  })

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form

  const onSubmit = async (values: DemoRequestInput) => {
    setSubmitting(true)
    try {
      const res = await submitDemoRequest(values as unknown as Record<string, unknown>)
      if (res.success) {
        onSuccess()
      } else {
        notify.error(res.error ?? "Une erreur est survenue. Veuillez réessayer.")
      }
    } catch {
      notify.error("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="motion-safe relative bg-card border border-border/50 shadow-soft rounded-2xl p-6 sm:p-8"
      noValidate
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
        <Field id="fullName" label="Nom complet" error={errors.fullName?.message}>
          <Input
            id="fullName"
            type="text"
            size="lg"
            placeholder="Jean Dupont"
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            {...register("fullName")}
          />
        </Field>
        <Field id="companyName" label="Entreprise" error={errors.companyName?.message}>
          <Input
            id="companyName"
            type="text"
            size="lg"
            placeholder="Maison Dupont Traiteur"
            aria-invalid={errors.companyName ? true : undefined}
            aria-describedby={errors.companyName ? "companyName-error" : undefined}
            {...register("companyName")}
          />
        </Field>
        <Field id="email" label="Email professionnel" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            size="lg"
            placeholder="jean@maison-dupont.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </Field>
        <Field id="phone" label="Téléphone / WhatsApp" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            size="lg"
            placeholder="+33 6 12 34 56 78"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            {...register("phone")}
          />
        </Field>
        <Field id="city" label="Ville" error={errors.city?.message}>
          <Input
            id="city"
            type="text"
            size="lg"
            placeholder="Paris"
            aria-invalid={errors.city ? true : undefined}
            aria-describedby={errors.city ? "city-error" : undefined}
            {...register("city")}
          />
        </Field>
        <Field id="country" label="Pays" error={errors.country?.message}>
          <Input
            id="country"
            type="text"
            size="lg"
            placeholder="France"
            aria-invalid={errors.country ? true : undefined}
            aria-describedby={errors.country ? "country-error" : undefined}
            {...register("country")}
          />
        </Field>
        <Field id="companySize" label="Taille de l'entreprise" error={errors.companySize?.message}>
          <Select
            value={watch("companySize")}
            onValueChange={(v) => setValue("companySize", v ?? "", { shouldValidate: true })}
          >
            <SelectTrigger
              id="companySize"
              size="lg"
              className="w-full min-w-0 text-base md:text-sm"
              aria-invalid={errors.companySize ? true : undefined}
              aria-describedby={errors.companySize ? "companySize-error" : undefined}
            >
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="monthlyEvents" label="Événements par mois" error={errors.monthlyEvents?.message}>
          <Select
            value={watch("monthlyEvents")}
            onValueChange={(v) => setValue("monthlyEvents", v ?? "", { shouldValidate: true })}
          >
            <SelectTrigger
              id="monthlyEvents"
              size="lg"
              className="w-full min-w-0 text-base md:text-sm"
              aria-invalid={errors.monthlyEvents ? true : undefined}
              aria-describedby={errors.monthlyEvents ? "monthlyEvents-error" : undefined}
            >
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {MONTHLY_EVENTS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="message" label="Message (optionnel)" error={errors.message?.message} className="sm:col-span-2">
          <Textarea
            id="message"
            size="lg"
            rows={3}
            placeholder="Parlez-nous de votre activité, vos besoins, vos défis…"
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "message-error" : undefined}
            {...register("message")}
            className="min-h-[90px] resize-none"
          />
        </Field>
      </div>

      <div className="flex items-start gap-2.5 mt-5">
        <input
          type="checkbox"
          id="privacy"
          name="privacyAccepted"
          aria-required="true"
          aria-invalid={errors.privacyAccepted ? true : undefined}
          aria-describedby={errors.privacyAccepted ? "privacy-error" : undefined}
          checked={!!watch("privacyAccepted")}
          onChange={(e) => setValue("privacyAccepted", e.target.checked as unknown as true, { shouldValidate: true })}
          className="mt-0.5 size-4 rounded border-border accent-gold shrink-0"
        />
        <div>
          <label htmlFor="privacy" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            J&apos;accepte la{" "}
            <a href="#" className="text-foreground font-medium underline underline-offset-2 decoration-border hover:decoration-foreground transition-all">
              politique de confidentialité
            </a>{" "}
            de TUR.
          </label>
          {errors.privacyAccepted?.message && (
            <p id="privacy-error" role="alert" className="mt-1 text-xs text-destructive">{errors.privacyAccepted.message}</p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="group relative w-full inline-flex items-center justify-center gap-2.5 h-11 rounded-lg bg-foreground text-primary-foreground px-6 text-sm font-semibold shadow-lift hover:shadow-gold hover:opacity-90 active:translate-y-px transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Envoi en cours…
            </>
          ) : (
            <>
              Demander ma démo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        <p className="mt-2 text-center text-[10px] text-muted-foreground/50">
          Aucun compte n&apos;est créé. Un membre de notre équipe vous contactera après validation.
        </p>
      </div>
    </motion.form>
  )
}
