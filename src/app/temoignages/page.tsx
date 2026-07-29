"use client";

import { motion } from "framer-motion";
import { Star, Quote, ArrowRight, CalendarDays, Shield, Zap, TrendingUp, HeadphonesIcon } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SectionLabel } from "@/components/site/ProblemSolution";

const stats = [
  { value: "1 200+", label: "Traiteurs actifs" },
  { value: "48 000+", label: "Événements gérés" },
  { value: "12h", label: "Économisées / semaine" },
  { value: "4.9/5", label: "Note moyenne" },
];

const testimonials = [
  {
    quote: "TUR a remplacé 4 outils différents. Mes devis partent en 2 minutes, mon équipe est alignée, et mes clients adorent le rendu PDF.",
    name: "Camille Lambert",
    role: "Fondatrice · Lambert Traiteur",
    initials: "CL",
    rating: 5,
  },
  {
    quote: "Fini WhatsApp en 47 conversations parallèles. Tout est centralisé, traçable, élégant. Le calendrier intelligent m'a évité 3 doubles bookings ce trimestre.",
    name: "Marc Béringer",
    role: "Directeur · Béringer Events",
    initials: "MB",
    rating: 5,
  },
  {
    quote: "L'Event Builder est bluffant. Je compose un menu pour 200 personnes en 5 minutes, avec marge calculée en direct. Ça change tout.",
    name: "Sofia Almeida",
    role: "Chef · Maison Almeida",
    initials: "SA",
    rating: 5,
  },
  {
    quote: "Une finition de produit que je n'avais jamais vue dans notre secteur. TUR donne une image premium à mon entreprise dès le premier devis.",
    name: "Julien Caron",
    role: "Traiteur indépendant",
    initials: "JC",
    rating: 5,
  },
  {
    quote: "Le module de paiement intégré nous a fait gagner un temps fou. Plus de relances manuelles, plus de chèques à encaisser. Tout est automatisé et tracé.",
    name: "Nadia El Fakir",
    role: "COO · Traiteur El Fakir",
    initials: "NE",
    rating: 5,
  },
  {
    quote: "Nous utilisions trois logiciels différents avant TUR. Aujourd'hui, tout tient dans un tableau de bord unique. La courbe d'apprentissage est quasi nulle.",
    name: "Alexandre Dupuis",
    role: "Gérant · Dupuis Traiteur",
    initials: "AD",
    rating: 5,
  },
  {
    quote: "Le générateur de devis PDF est un bijou. Mes clients me complimentent sur la qualité des documents. Je n'ai jamais été aussi professionnel.",
    name: "Clara Benzaïd",
    role: "Traiteur événementiel",
    initials: "CB",
    rating: 5,
  },
  {
    quote: "L'intégration WhatsApp a changé notre relation client. Tout est centralisé, rien ne se perd. Nos équipes gagnent au moins 10 heures par semaine.",
    name: "Rachid Othmani",
    role: "Directeur opérationnel · Othmani Events",
    initials: "RO",
    rating: 5,
  },
];

const trustItems = [
  {
    icon: Shield,
    title: "Sécurité des données",
    desc: "Vos données sont protégées grâce à une infrastructure sécurisée et des sauvegardes régulières.",
  },
  {
    icon: Zap,
    title: "Performance",
    desc: "Une application rapide et optimisée pour gagner du temps au quotidien.",
  },
  {
    icon: TrendingUp,
    title: "Évolutif",
    desc: "Traytio évolue continuellement avec de nouvelles fonctionnalités adaptées aux besoins des traiteurs.",
  },
  {
    icon: HeadphonesIcon,
    title: "Support humain",
    desc: "Notre équipe vous accompagne pour une prise en main simple et un suivi personnalisé.",
  },
];

const featured = testimonials[0];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5 text-gold-deep">
      {Array.from({ length: count }, (_, j) => (
        <Star key={j} className="h-3.5 w-3.5 fill-current" />
      ))}
    </div>
  );
}

export default function TemoignagesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[600px] bg-radiance" />

      {/* Hero */}
      <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SectionLabel>Témoignages</SectionLabel>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 font-display text-[clamp(3rem,6vw,5.5rem)] leading-[0.95] tracking-tight"
          >
            Ils font confiance à{" "}
            <span className="italic text-gradient-gold">Traytio.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed"
          >
            Découvrez comment des traiteurs développent leur activité grâce à Traytio.
          </motion.p>
        </div>
      </section>

      {/* Customer stats */}
      <section className="relative pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-3xl overflow-hidden shadow-soft border border-border">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group relative bg-card p-8 lg:p-10 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-[0.06] transition-opacity" />
                <div className="relative">
                  <div className="font-display text-5xl lg:text-6xl text-gradient-charcoal">{s.value}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
                </div>
                <div className="absolute -bottom-px left-0 h-px w-0 bg-gradient-gold group-hover:w-full transition-all duration-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured testimonial */}
      <section className="relative pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.figure
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-[2rem] bg-gradient-charcoal text-primary-foreground overflow-hidden p-10 lg:p-16"
          >
            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-gradient-gold opacity-25 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-gold opacity-10 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

            <div className="relative">
              <Quote className="h-10 w-10 text-gold/40 mb-6" />
              <blockquote className="font-display text-3xl lg:text-5xl leading-snug tracking-tight max-w-4xl">
                &ldquo;{featured.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground text-sm font-semibold">
                  {featured.initials}
                </span>
                <div>
                  <div className="text-base font-semibold">{featured.name}</div>
                  <div className="text-sm text-primary-foreground/60">{featured.role}</div>
                </div>
              </figcaption>
            </div>
          </motion.figure>
        </div>
      </section>

      {/* Testimonials grid */}
      <section className="relative pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl lg:text-5xl tracking-tight">
              Ce que disent nos clients
            </h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-lg mx-auto">
              Des traiteurs de toutes tailles partagent leur expérience.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-2 gap-5"
          >
            {testimonials.slice(1).map((t, i) => (
              <motion.figure
                key={t.name}
                variants={itemVariants}
                className="relative group rounded-3xl border border-border bg-card p-8 hover:shadow-lift transition-all overflow-hidden"
              >
                <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-gradient-gold opacity-0 group-hover:opacity-20 blur-3xl transition-opacity" />
                <div className="relative">
                  <Stars count={t.rating} />
                  <blockquote className="mt-5 font-display text-2xl lg:text-3xl leading-snug tracking-tight">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 pt-6 border-t border-border">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground text-xs font-semibold">
                      {t.initials}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </figcaption>
                </div>
              </motion.figure>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why trust Traytio */}
      <section className="relative pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-14">
            <SectionLabel>Pourquoi choisir Traytio</SectionLabel>
            <h2 className="mt-4 font-display text-5xl lg:text-6xl tracking-tight">
              Pourquoi choisir <span className="italic text-gradient-gold">Traytio&nbsp;?</span>
            </h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
              Une plateforme conçue pour accompagner les traiteurs avec des outils modernes, fiables et évolutifs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {trustItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group relative rounded-3xl border border-border bg-card p-8 hover:shadow-lift transition-all overflow-hidden"
                >
                  <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-gradient-gold opacity-0 group-hover:opacity-20 blur-3xl transition-opacity" />
                  <div className="relative">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-gold/10 text-gold-deep mb-5">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="font-display text-2xl tracking-tight mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative pb-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-[2rem] bg-gradient-charcoal text-primary-foreground overflow-hidden p-12 lg:p-20 text-center"
          >
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[120%] bg-gradient-gold opacity-25 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full glass-dark px-3 py-1.5 text-xs text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                Disponible dès aujourd&apos;hui
              </div>
              <h2 className="mt-6 font-display text-5xl lg:text-7xl tracking-tight max-w-4xl mx-auto leading-[1]">
                Rejoignez les traiteurs qui
                <br />
                <span className="italic text-gradient-gold">passent à Traytio.</span>
              </h2>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/#pricing"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-gold text-gold-foreground px-7 py-3.5 text-sm font-semibold shadow-gold hover:scale-[1.02] transition-transform"
                >
                  Commencer maintenant
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/demo"
                  className="group inline-flex items-center gap-2 rounded-full glass-dark px-7 py-3.5 text-sm font-medium text-primary-foreground hover:bg-white/5 transition-colors"
                >
                  <CalendarDays className="h-4 w-4" />
                  Réserver une démo
                </Link>
              </div>
              <p className="mt-6 text-xs text-primary-foreground/50">Sans carte bancaire · 14 jours d&apos;essai · Annulation à tout moment</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
