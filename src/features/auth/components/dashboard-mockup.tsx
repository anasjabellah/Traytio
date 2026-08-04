"use client";
import { motion } from "framer-motion";
import { CalendarDays, TrendingUp, Users, Wallet } from "lucide-react";

const orders = [
  { name: "Mariage Lambert", date: "12 Oct", price: "MAD 84 000", color: "bg-gold" },
  { name: "Gala Crédit Suisse", date: "14 Oct", price: "MAD 129 000", color: "bg-foreground" },
  { name: "Cocktail Hermès", date: "16 Oct", price: "MAD 52 000", color: "bg-gold-deep" },
];

export function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
      className="relative mx-auto max-w-[520px]"
    >
      {/* Gold aura */}
      <div className="absolute -inset-10 rounded-full bg-gradient-gold opacity-20 blur-3xl" />

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative glass shadow-lift ring-1 ring-white/20 rounded-3xl p-2.5"
      >
        <div className="overflow-hidden rounded-2xl border border-white/25 bg-card">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-border/60 bg-surface-soft px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              tur.app/dashboard
            </div>
            <div className="h-5 w-5 rounded-full bg-gradient-gold" />
          </div>

          <div className="grid grid-cols-6 gap-3 p-4">
            {/* Revenue */}
            <div className="relative col-span-4 overflow-hidden rounded-xl bg-gradient-charcoal p-5 text-primary-foreground">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-gold opacity-30 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-primary-foreground/60">
                  Revenue · Octobre
                </span>
                <TrendingUp className="h-3.5 w-3.5 text-gold" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl">MAD 482 900</span>
                <span className="text-xs text-gold">+24%</span>
              </div>
              <svg viewBox="0 0 200 60" className="mt-3 h-14 w-full">
                <defs>
                  <linearGradient id="auth-g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.80 0.11 84)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="oklch(0.80 0.11 84)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 45 L25 38 L50 42 L75 28 L100 32 L125 18 L150 22 L175 12 L200 8 L200 60 L0 60 Z" fill="url(#auth-g1)" />
                <path d="M0 45 L25 38 L50 42 L75 28 L100 32 L125 18 L150 22 L175 12 L200 8" stroke="oklch(0.85 0.09 86)" strokeWidth="1.5" fill="none" />
              </svg>
            </div>

            {/* Stats */}
            <div className="col-span-2 space-y-3">
              <StatTile icon={<Users className="h-3.5 w-3.5" />} label="Clients" value="284" delta="+12" />
              <StatTile icon={<CalendarDays className="h-3.5 w-3.5" />} label="Événements" value="47" delta="+5" />
            </div>

            {/* Orders */}
            <div className="col-span-6 rounded-xl border border-border/60 bg-surface-elevated">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
                <span className="text-xs font-medium">Commandes à venir</span>
                <span className="text-[10px] text-muted-foreground">3 actives</span>
              </div>
              {orders.map((o) => (
                <div key={o.name} className="flex items-center justify-between border-b border-border/40 px-4 py-2.5 last:border-0">
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
      </motion.div>

      {/* Floating card */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-8 -right-4 w-44 rounded-2xl glass p-3.5 shadow-lift"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold">
            <Wallet className="h-4 w-4 text-gold-foreground" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Paiement reçu</div>
            <div className="text-sm font-semibold">MAD 32 000</div>
          </div>
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
        <span className="text-[10px] font-medium text-gold-deep">{delta}</span>
      </div>
      <div className="mt-2 font-display text-2xl">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
