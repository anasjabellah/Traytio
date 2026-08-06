"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Send, CheckCircle2, Loader2 } from "lucide-react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SectionLabel } from "@/components/site/ProblemSolution";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";

import { contactSchema, type ContactInput } from "@/features/contact/validations/contact-schema";
import { submitContact } from "@/features/contact/actions/submit-contact";

function ContactField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", message: "" },
  });

  const onSubmit = async (values: ContactInput) => {
    setSubmitting(true);
    try {
      const res = await submitContact(values as unknown as Record<string, unknown>);
      if (res.success) {
        setSubmitted(true);
      } else {
        notify.error(res.error ?? "Une erreur est survenue. Veuillez réessayer.");
      }
    } catch {
      notify.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[600px] bg-radiance" />

      <section className="relative mx-auto max-w-7xl px-6 pt-36 pb-24 lg:pt-44 lg:pb-32">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Contact</SectionLabel>
          <h1 className="font-display text-5xl lg:text-6xl tracking-tight mt-4">
            Parlons de votre projet
          </h1>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
            Une question, un besoin spécifique&nbsp;? Notre équipe vous répond sous 24&nbsp;h.
          </p>
        </div>

        {submitted ? (
          <div className="mx-auto max-w-lg bg-card border border-border/50 shadow-soft rounded-2xl p-8 sm:p-10 text-center">
            <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-gold/15">
              <CheckCircle2 className="size-7 text-gold" />
            </span>
            <h2 className="font-display text-2xl tracking-tight mb-2">Message envoyé</h2>
            <p className="text-muted-foreground">
              Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
            </p>
          </div>
        ) : (
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="motion-safe relative mx-auto max-w-lg bg-card border border-border/50 shadow-soft rounded-2xl p-6 sm:p-8"
            noValidate
          >
            <div className="space-y-5">
              <ContactField id="name" label="Nom complet" error={errors.name?.message}>
                <Input
                  id="name"
                  type="text"
                  size="lg"
                  placeholder="Votre nom"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  {...register("name")}
                />
              </ContactField>
              <ContactField id="email" label="Email" error={errors.email?.message}>
                <Input
                  id="email"
                  type="email"
                  size="lg"
                  placeholder="vous@exemple.com"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
              </ContactField>
              <ContactField id="message" label="Message" error={errors.message?.message}>
                <Textarea
                  id="message"
                  size="lg"
                  rows={5}
                  placeholder="Décrivez votre projet..."
                  className="resize-y min-h-32"
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? "message-error" : undefined}
                  {...register("message")}
                />
              </ContactField>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="group w-full inline-flex items-center justify-center gap-2.5 h-11 rounded-lg bg-foreground text-primary-foreground px-6 text-sm font-medium shadow-lift hover:shadow-gold hover:opacity-90 active:translate-y-px transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    Envoyer
                    <Send className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </section>

      <Footer />
    </main>
  );
}
