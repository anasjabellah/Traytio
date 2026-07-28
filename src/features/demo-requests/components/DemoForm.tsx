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

const inputCls = "h-11 rounded-xl bg-background border-border/70 focus-visible:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/20 shadow-xs transition-all"
const selectCls = "!h-11 w-full rounded-xl bg-background border-border/70 focus-visible:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/20 shadow-xs transition-all py-0"

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
      className="relative bg-card border border-border/50 shadow-soft rounded-2xl p-6 sm:p-8"
      noValidate
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
        <Field label="Nom complet" error={errors.fullName?.message}>
          <Input placeholder="Jean Dupont" {...register("fullName")} className={inputCls} />
        </Field>
        <Field label="Entreprise" error={errors.companyName?.message}>
          <Input placeholder="Maison Dupont Traiteur" {...register("companyName")} className={inputCls} />
        </Field>
        <Field label="Email professionnel" error={errors.email?.message}>
          <Input type="email" placeholder="jean@maison-dupont.com" {...register("email")} className={inputCls} />
        </Field>
        <Field label="Téléphone / WhatsApp" error={errors.phone?.message}>
          <Input placeholder="+33 6 12 34 56 78" {...register("phone")} className={inputCls} />
        </Field>
        <Field label="Ville" error={errors.city?.message}>
          <Input placeholder="Paris" {...register("city")} className={inputCls} />
        </Field>
        <Field label="Pays" error={errors.country?.message}>
          <Input placeholder="France" {...register("country")} className={inputCls} />
        </Field>
        <Field label="Taille de l'entreprise" error={errors.companySize?.message}>
          <Select
            value={watch("companySize")}
            onValueChange={(v) => setValue("companySize", v ?? "", { shouldValidate: true })}
          >
            <SelectTrigger className={selectCls}>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Événements par mois" error={errors.monthlyEvents?.message}>
          <Select
            value={watch("monthlyEvents")}
            onValueChange={(v) => setValue("monthlyEvents", v ?? "", { shouldValidate: true })}
          >
            <SelectTrigger className={selectCls}>
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
            rows={3}
            placeholder="Parlez-nous de votre activité, vos besoins, vos défis…"
            {...register("message")}
            className="rounded-xl bg-background border-border/70 focus-visible:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/20 shadow-xs transition-all resize-none min-h-[90px]"
          />
        </Field>
      </div>

      <div className="flex items-start gap-2.5 mt-5">
        <input
          type="checkbox"
          id="privacy"
          checked={!!watch("privacyAccepted")}
          onChange={(e) => setValue("privacyAccepted", e.target.checked as unknown as true, { shouldValidate: true })}
          className="mt-0.5 size-4 rounded border-border accent-gold shrink-0"
        />
        <div>
          <label htmlFor="privacy" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            J'accepte la{" "}
            <a href="#" className="text-foreground font-medium underline underline-offset-2 decoration-border hover:decoration-foreground transition-all">
              politique de confidentialité
            </a>{" "}
            de TUR.
          </label>
          {errors.privacyAccepted?.message && (
            <p className="mt-1 text-xs text-destructive">{errors.privacyAccepted.message}</p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <button
          type="submit"
          disabled={submitting}
          className="group relative w-full inline-flex items-center justify-center gap-2.5 h-11 rounded-xl bg-foreground text-primary-foreground px-6 text-sm font-semibold shadow-lift hover:shadow-gold hover:opacity-90 active:translate-y-px transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0"
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
          Aucun compte n'est créé. Un membre de notre équipe vous contactera après validation.
        </p>
      </div>
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
