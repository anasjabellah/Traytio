"use client";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  FileText,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { SectionLabel } from "@/components/site/ProblemSolution";
import { DASHBOARD_SHOWCASE } from "../constants";

const ease = [0.22, 1, 0.36, 1] as const;

const STATUS_STYLES: Record<string, string> = {
  Confirmé: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
  "En cours": "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50",
  Planifié: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50",
};

export function DashboardShowcase() {
  return (
    <section className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease }}
            className="lg:col-span-3"
          >
            <div className="relative rounded-2xl bg-[#faf7f2] shadow-lift border border-[#e8e2d8] overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#e8e2d8] bg-[#f5f0e8]">
                <span className="size-2 rounded-full bg-red-400/80" />
                <span className="size-2 rounded-full bg-yellow-400/80" />
                <span className="size-2 rounded-full bg-emerald-400/80" />
                <span className="flex-1 text-center text-[10px] font-medium text-muted-foreground tracking-[0.15em]">
                  TRAYTIO.APP/DASHBOARD
                </span>
                <div className="w-12" />
              </div>

              <div className="p-5 lg:p-6 space-y-5 bg-[#f6f2eb]">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-[2] rounded-2xl bg-gradient-to-br from-[#1a1410] to-[#0d0a08] p-6 lg:p-7 relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-white/[0.06] pointer-events-none" />

                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs uppercase tracking-wider text-white/40">Revenus du mois</span>
                        <span className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 rounded-full font-medium ring-1 ring-gold/20">
                          +18.5%
                        </span>
                      </div>
                      <p className="font-display text-3xl lg:text-4xl tabular-nums text-white mt-0.5">42 800 MAD</p>

                      <svg viewBox="0 0 280 64" className="w-full h-14 mt-5">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#C9A96E" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#C9A96E" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,50 Q14,46 28,48 T56,42 T84,44 T112,36 T140,32 T168,26 T196,30 T224,22 T252,16 T280,12"
                          fill="none"
                          stroke="#C9A96E"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M0,50 Q14,46 28,48 T56,42 T84,44 T112,36 T140,32 T168,26 T196,30 T224,22 T252,16 T280,12 L280,64 L0,64 Z"
                          fill="url(#chartGrad)"
                        />
                        <circle cx="280" cy="12" r="2.5" fill="#C9A96E" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex-1 rounded-2xl border border-border bg-card shadow-soft p-5 hover:shadow-lift transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="size-10 rounded-xl bg-foreground/[0.04] flex items-center justify-center">
                          <CalendarCheck className="size-4 text-gold-deep" />
                        </div>
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md ring-1 ring-emerald-200/50">
                          +18%
                        </span>
                      </div>
                      <p className="font-display text-xl lg:text-2xl tabular-nums text-gradient-charcoal">24</p>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground mt-1 block">
                        Événements
                      </span>
                    </div>

                    <div className="flex-1 rounded-2xl border border-border bg-card shadow-soft p-5 hover:shadow-lift transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="size-10 rounded-xl bg-foreground/[0.04] flex items-center justify-center">
                          <FileText className="size-4 text-gold-deep" />
                        </div>
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md ring-1 ring-emerald-200/50">
                          +8%
                        </span>
                      </div>
                      <p className="font-display text-xl lg:text-2xl tabular-nums text-gradient-charcoal">12</p>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground mt-1 block">
                        Devis
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        <TrendingUp className="size-3.5 inline mr-1.5 text-gold-deep" />
                        Activité récente
                      </div>
                      <h3 className="font-display text-2xl mt-1">Commandes récentes</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-emerald-700 font-medium">Live</span>
                    </div>
                  </div>

                  <div className="hidden lg:grid grid-cols-4 gap-4 px-6 py-3 text-[10px] uppercase tracking-wider text-muted-foreground bg-foreground/[0.02] border-t border-border">
                    <span>Client / Événement</span>
                    <span className="text-center">Statut</span>
                    <span className="text-center">Valeur</span>
                    <span className="text-right">Date</span>
                  </div>

                  {DASHBOARD_SHOWCASE.recentActivity.map((item, i) => (
                    <motion.div
                      key={item.client}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="grid lg:grid-cols-4 gap-4 px-6 py-3.5 items-center border-b border-border last:border-b-0 hover:bg-foreground/[0.02] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="size-1.5 rounded-full shrink-0 bg-gold" />
                        <span className="text-sm font-medium text-foreground">{item.client}</span>
                      </div>
                      <span className={`text-[10px] text-center font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[item.status]}`}>
                        {item.status}
                      </span>
                      <span className="text-sm tabular-nums text-foreground text-center font-medium">{item.value} MAD</span>
                      <span className="text-xs text-muted-foreground text-right">{item.date}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <SectionLabel>La plateforme</SectionLabel>
            <h2 className="font-display text-[clamp(2rem,3.5vw,3rem)] tracking-tight leading-[1.08] text-foreground">
              Votre tableau de bord&nbsp;
              <span className="italic text-gradient-gold">centralisé</span>
            </h2>
            <p className="mt-5 text-base lg:text-lg text-muted-foreground leading-relaxed">
              Pilotez l&apos;intégralité de votre activité traiteur depuis un tableau de bord clair, temps réel, conçu pour vous offrir une vision à 360°.
            </p>
            <div className="mt-10 space-y-5">
              {DASHBOARD_SHOWCASE.right.items.map((item) => (
                <div key={item.text} className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 border border-gold/20">
                    <item.icon className="size-[1.125rem] text-gold-deep" />
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground leading-relaxed block pt-1">{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
