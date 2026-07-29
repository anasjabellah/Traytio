"use client";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  FileText,
  CreditCard,
  Settings,
  Bot,
  Bell,
  ChevronDown,
  TrendingUp,
  Activity,
} from "lucide-react";
import { SectionLabel } from "@/components/site/ProblemSolution";
import { DASHBOARD_SHOWCASE } from "../constants";

const ease = [0.22, 1, 0.36, 1] as const;

const sidebarItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", active: true, badge: "" },
  { icon: CalendarCheck, label: "Événements", active: false, badge: "24" },
  { icon: Users, label: "Clients", active: false, badge: "" },
  { icon: FileText, label: "Devis", active: false, badge: "12" },
  { icon: CreditCard, label: "Factures", active: false, badge: "" },
  { icon: Settings, label: "Paramètres", active: false, badge: "" },
];

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
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#e8e2d8] bg-[#f5f0e8]">
                <span className="size-2.5 rounded-full bg-red-400/80" />
                <span className="size-2.5 rounded-full bg-yellow-400/80" />
                <span className="size-2.5 rounded-full bg-emerald-400/80" />
                <div className="ml-4 flex-1 max-w-[12rem] rounded-md bg-[#ebe5db] px-3 py-1.5 text-[10px] text-muted-foreground text-center truncate">
                  app.traytio.io/dashboard
                </div>
                <div className="flex-1" />
              </div>

              <div className="flex h-[30rem] lg:h-[34rem]">
                <div className="w-[11rem] shrink-0 border-r border-[#e8e2d8] bg-[#f0ebe3] p-3 hidden sm:flex flex-col gap-0.5">
                  {sidebarItems.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-all duration-200 ${
                        item.active
                          ? "bg-gold/15 text-gold font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-black/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="size-3.5 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-black/[0.04] text-[9px] text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto bg-[#f6f2eb]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Tableau de bord</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-[#f0ebe3] rounded-md px-2.5 py-1.5 border border-[#e8e2d8]">
                      Cette semaine
                      <ChevronDown className="size-3" />
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#1a1612] p-5 border border-white/[0.08]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingUp className="size-3 text-gold" />
                          Revenus du mois
                        </span>
                        <p className="text-2xl font-bold text-white mt-1">42 800 MAD</p>
                      </div>
                      <span className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 rounded-full font-medium">
                        +18.5%
                      </span>
                    </div>
                    <svg viewBox="0 0 280 72" className="w-full h-[4.5rem]">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C9A96E" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#C9A96E" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,56 Q14,52 28,54 T56,48 T84,50 T112,42 T140,38 T168,32 T196,36 T224,28 T252,22 T280,18"
                        fill="none"
                        stroke="#C9A96E"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M0,56 Q14,52 28,54 T56,48 T84,50 T112,42 T140,38 T168,32 T196,36 T224,28 T252,22 T280,18 L280,72 L0,72 Z"
                        fill="url(#chartGrad)"
                      />
                      <circle cx="280" cy="18" r="2.5" fill="#C9A96E" />
                    </svg>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white p-4 border border-[#e8e2d8]">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Événements</span>
                      <p className="text-xl font-bold text-foreground mt-1">24</p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="size-2 rounded-full bg-gold" />
                        <span className="text-[10px] text-gold">+18%</span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-4 border border-[#e8e2d8]">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Devis</span>
                      <p className="text-xl font-bold text-foreground mt-1">12</p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="size-2 rounded-full bg-gold" />
                        <span className="text-[10px] text-gold">+8%</span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-4 border border-[#e8e2d8]">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Clients</span>
                      <p className="text-xl font-bold text-foreground mt-1">18</p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="size-2 rounded-full bg-gold" />
                        <span className="text-[10px] text-gold">+12%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Activity className="size-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Activité récente</span>
                    </div>
                    <div className="space-y-2">
                      {DASHBOARD_SHOWCASE.recentActivity.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-3 text-xs rounded-lg px-3 py-2 border border-[#e8e2d8] bg-white"
                        >
                          <span className="size-2 rounded-full shrink-0 bg-gold" />
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground/60">
                            {item.type === "client" ? "il y a 2 min" : item.type === "devis" ? "il y a 15 min" : "il y a 1 h"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
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
