"use client";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, TrendingUp, Users, CalendarDays, Wallet } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-36 pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[1200px] bg-radiance pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
        {/* LEFT */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-gold animate-ping opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-deep" />
            </span>
            Nouveau · Event Builder propulsé par l'IA
            <Sparkles className="h-3 w-3 text-gold-deep" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 font-display text-[clamp(3rem,6.5vw,5.75rem)] leading-[0.95] tracking-tight"
          >
            Le système d'exploitation des
            <br />
            <span className="italic text-gradient-gold">traiteurs modernes.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed"
          >
            Clients, devis, commandes, événements et paiements — réunis dans une plateforme
            premium pensée pour les professionnels du catering.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <a
              href="#pricing"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground text-primary-foreground px-6 py-3.5 text-sm font-medium shadow-lift hover:shadow-gold transition-all"
            >
              Commencer maintenant
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#demo"
              className="group inline-flex items-center gap-2 rounded-full glass px-6 py-3.5 text-sm font-medium hover:shadow-soft transition-all"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-gold">
                <Play className="h-3 w-3 text-gold-foreground fill-current" />
              </span>
              Voir la démo
            </a>
          </motion.div>

          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex -space-x-2">
              {[0,1,2,3].map((i) => (
                <div key={i} className="h-7 w-7 rounded-full bg-gradient-gold ring-2 ring-background" style={{ filter: `hue-rotate(${i*15}deg)` }} />
              ))}
            </div>
            <span><strong className="text-foreground">+1 200 traiteurs</strong> nous font déjà confiance</span>
          </div>
        </div>

        {/* RIGHT — Dashboard mockup */}
        <DashboardMock />
      </div>
    </section>
  );
}

function DashboardMock() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Glow */}
      <div className="absolute -inset-10 bg-gradient-gold opacity-20 blur-3xl rounded-full" />

      <div className="relative glass shadow-glass rounded-3xl p-3">
        <div className="rounded-2xl bg-card overflow-hidden border border-border/60">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-surface-soft">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">tur.app/dashboard</div>
            <div className="h-5 w-5 rounded-full bg-gradient-gold" />
          </div>

          <div className="p-5 grid grid-cols-6 gap-3">
            {/* Revenue */}
            <div className="col-span-4 rounded-xl bg-gradient-charcoal p-5 text-primary-foreground relative overflow-hidden">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-gold opacity-30 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-primary-foreground/60">Revenue · Octobre</span>
                <TrendingUp className="h-3.5 w-3.5 text-gold" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl">€48 290</span>
                <span className="text-xs text-gold">+24%</span>
              </div>
              {/* Chart */}
              <svg viewBox="0 0 200 60" className="mt-3 w-full h-14">
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.80 0.11 84)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="oklch(0.80 0.11 84)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 45 L25 38 L50 42 L75 28 L100 32 L125 18 L150 22 L175 12 L200 8 L200 60 L0 60 Z" fill="url(#g1)" />
                <path d="M0 45 L25 38 L50 42 L75 28 L100 32 L125 18 L150 22 L175 12 L200 8" stroke="oklch(0.85 0.09 86)" strokeWidth="1.5" fill="none" />
              </svg>
            </div>

            {/* Stats */}
            <div className="col-span-2 space-y-3">
              <StatTile icon={<Users className="h-3.5 w-3.5" />} label="Clients" value="284" delta="+12" />
              <StatTile icon={<CalendarDays className="h-3.5 w-3.5" />} label="Événements" value="47" delta="+5" />
            </div>

            {/* Orders list */}
            <div className="col-span-6 rounded-xl border border-border/60 bg-surface-elevated">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
                <span className="text-xs font-medium">Commandes à venir</span>
                <span className="text-[10px] text-muted-foreground">3 actives</span>
              </div>
              {[
                { name: "Mariage Lambert", date: "12 Oct", price: "€8 400", color: "bg-gold" },
                { name: "Gala Crédit Suisse", date: "14 Oct", price: "€12 900", color: "bg-foreground" },
                { name: "Cocktail Hermès", date: "16 Oct", price: "€5 200", color: "bg-gold-deep" },
              ].map((o, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${o.color}`} />
                    <span className="text-xs font-medium">{o.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span>{o.date}</span>
                    <span className="font-medium text-foreground">{o.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-6 top-1/3 glass shadow-lift rounded-2xl p-3.5 w-48 hidden md:block"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center">
            <Wallet className="h-4 w-4 text-gold-foreground" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Paiement reçu</div>
            <div className="text-sm font-semibold">€3 200</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -right-4 bottom-10 glass shadow-lift rounded-2xl p-3.5 w-52 hidden md:block"
      >
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Devis envoyé</div>
        <div className="text-sm font-semibold mt-0.5">Mariage Dubois · 80 pax</div>
        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full w-3/4 bg-gradient-gold rounded-full" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatTile({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: string; delta: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface-elevated p-3">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gold-soft text-gold-deep">{icon}</span>
        <span className="text-[10px] text-gold-deep font-medium">{delta}</span>
      </div>
      <div className="mt-2 font-display text-2xl">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}