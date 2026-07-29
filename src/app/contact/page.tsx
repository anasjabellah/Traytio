"use client";

import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SectionLabel } from "@/components/site/ProblemSolution";
import { Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

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
          <div className="mx-auto max-w-lg text-center py-16">
            <CheckCircle2 className="mx-auto h-12 w-12 text-gold mb-4" />
            <h2 className="font-display text-2xl tracking-tight mb-2">Message envoyé</h2>
            <p className="text-muted-foreground">Nous vous répondrons dans les plus brefs délais.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
            className="mx-auto max-w-lg space-y-6"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">Nom complet</label>
              <input
                id="name"
                type="text"
                required
                placeholder="Votre nom"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                required
                placeholder="vous@exemple.com"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1.5">Message</label>
              <textarea
                id="message"
                rows={5}
                required
                placeholder="Décrivez votre projet..."
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/50 resize-y"
              />
            </div>
            <button
              type="submit"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground text-primary-foreground pl-6 pr-4 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Envoyer
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground transition-transform group-hover:translate-x-0.5">
                <Send className="h-3.5 w-3.5" />
              </span>
            </button>
          </form>
        )}
      </section>

      <Footer />
    </main>
  );
}
