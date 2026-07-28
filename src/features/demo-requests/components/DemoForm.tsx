"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { ArrowRight, Loader2, Lock } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
import { BUSINESS_TYPES, COMPANY_SIZES, MONTHLY_EVENTS } from "../constants"

type DemoFormProps = {
  onSuccess: () => void
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
      businessType: "",
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
      className="relative glass shadow-glass rounded-3xl p-6 sm:p-8"
      noValidate
    >
      <div className="absolute -inset-6 bg-gradient-gold opacity-10 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Formulaire sécurisé</div>
          <div className="mt-1 font-display text-2xl tracking-tight">Vos informations</div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full glass px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Lock className="size-3" /> Chiffré
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nom complet" error={errors.fullName?.message}>
          <Input placeholder="Jean Dupont" {...register("fullName")} />
        </Field>
        <Field label="Entreprise" error={errors.companyName?.message}>
          <Input placeholder="Maison Dupont Traiteur" {...register("companyName")} />
        </Field>
        <Field label="Email professionnel" error={errors.email?.message}>
          <Input type="email" placeholder="jean@maison-dupont.com" {...register("email")} />
        </Field>
        <Field label="Téléphone / WhatsApp" error={errors.phone?.message}>
          <Input placeholder="+33 6 12 34 56 78" {...register("phone")} />
        </Field>
        <Field label="Ville" error={errors.city?.message}>
          <Input placeholder="Paris" {...register("city")} />
        </Field>
        <Field label="Pays" error={errors.country?.message}>
          <Input placeholder="France" {...register("country")} />
        </Field>

        <Field label="Type d'activité" error={errors.businessType?.message}>
          <Select
            value={watch("businessType")}
            onValueChange={(v) => setValue("businessType", v ?? "", { shouldValidate: true })}
          >
            <SelectTrigger className="h-11 rounded-xl bg-background" data-size="default">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Taille de l'entreprise" error={errors.companySize?.message}>
          <Select
            value={watch("companySize")}
            onValueChange={(v) => setValue("companySize", v ?? "", { shouldValidate: true })}
          >
            <SelectTrigger className="h-11 rounded-xl bg-background" data-size="default">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Événements par mois" error={errors.monthlyEvents?.message} className="sm:col-span-2">
          <Select
            value={watch("monthlyEvents")}
            onValueChange={(v) => setValue("monthlyEvents", v ?? "", { shouldValidate: true })}
          >
            <SelectTrigger className="h-11 rounded-xl bg-background" data-size="default">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {MONTHLY_EVENTS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Message (optionnel)" error={errors.message?.message} className="sm:col-span-2">
          <Textarea
            rows={4}
            placeholder="Parlez-nous de votre activité, vos besoins, vos défis…"
            {...register("message")}
            className="rounded-xl bg-background resize-none"
          />
        </Field>
      </div>

      <div className="mt-6 flex items-start gap-3">
        <input
          type="checkbox"
          id="privacy"
          checked={!!watch("privacyAccepted")}
          onChange={(e) => setValue("privacyAccepted", e.target.checked as unknown as true, { shouldValidate: true })}
          className="mt-0.5 size-4 rounded border-border accent-gold"
        />
        <label htmlFor="privacy" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
          J'accepte la{" "}
          <a href="#" className="text-foreground underline underline-offset-2 hover:text-gold-deep">
            politique de confidentialité
          </a>{" "}
          de TUR.
        </label>
      </div>
      {errors.privacyAccepted?.message && (
        <p className="mt-2 text-xs text-destructive">{errors.privacyAccepted.message}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="group mt-7 w-full inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-primary-foreground px-6 py-4 text-sm font-medium shadow-lift hover:shadow-gold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Aucun compte n'est créé à cette étape. Un membre de notre équipe vous contactera après validation.
      </p>
    </motion.form>
  )
}

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
      <div className="[&_input]:h-11 [&_input]:rounded-xl [&_input]:bg-background">{children}</div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
