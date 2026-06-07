"use client"

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, memo, useMemo } from "react";
import {
  Plus, Calendar as CalendarIcon, FileText, TrendingUp, TrendingDown,
  Users, Wallet, CheckCircle2, Clock, AlertTriangle, ArrowUpRight,
  ChevronRight, Sparkles, Crown,
  UserPlus, Utensils, FileSignature, ArrowRight, CircleDot,
  PartyPopper, Banknote, Receipt, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrivacyModeProvider, EyeToggle, SensitiveValue, usePrivacyMode } from '@/components/privacy-mode';
import { getDashboardData } from '@/features/dashboard/actions/get-dashboard-stats';
import type { DashboardData } from '@/features/dashboard/types';

const STATUS_STYLES: Record<string, string> = {
  "Confirmée": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
  "En cours": "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50",
  "Devis": "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50",
  "En attente": "bg-rose-50 text-rose-700 ring-1 ring-rose-200/50",
};

const COMMANDE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", QUOTED: "Devis", CONFIRMED: "Confirmée",
  IN_PROGRESS: "En cours", READY: "Prête", DELIVERED: "Livrée", CANCELLED: "Annulée",
};

const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", PLANNED: "Planifié", CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours", COMPLETED: "Terminé", CANCELLED: "Annulé",
};

const EVENT_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 ring-1 ring-gray-300/50",
  PLANNED: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50",
  CONFIRMED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50",
  COMPLETED: "bg-emerald-800 text-white ring-1 ring-emerald-900/50",
  CANCELLED: "bg-red-50 text-red-700 ring-1 ring-red-200/50",
};

const mad = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);

export default function Page() {
  return <Dashboard />;
}

/* ---------------- Animated counter ---------------- */
function useCounter(target: number, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

/* ---------------- Fetch hook ---------------- */
function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardData().then((res) => {
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Erreur de chargement');
      }
      setLoading(false);
    });
  }, []);

  return { data, loading, error };
}

/* ---------------- Page ---------------- */
function Dashboard() {
  const { data, loading, error } = useDashboardData();

  return (
    <PrivacyModeProvider>
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <Header />

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <DashboardError message={error} />
        ) : data ? (
          <DashboardContent data={data} />
        ) : null}

        <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Tous les services opérationnels
          </div>
          <div>© TUR — Suite traiteur premium</div>
        </footer>
      </div>
    </div>
    </PrivacyModeProvider>
  );
}

function DashboardContent({ data }: { data: DashboardData }) {
  const KPIS = useMemo(() => [
    { label: "Chiffre d'affaires", value: data.revenue, prefix: "MAD", delta: data.health.monthlyGrowth, trend: data.health.monthlyGrowth >= 0 ? "up" as const : "down" as const, spark: data.perfRevenue, icon: Wallet, accent: true, sensitive: true },
    { label: "Commandes actives", value: data.activeCommandes, delta: 0, trend: "up" as const, spark: data.perfPayments, icon: Receipt, sensitive: true },
    { label: "Événements à venir", value: data.upcomingEvents.length, delta: 0, trend: "up" as const, spark: data.perfEvents, icon: PartyPopper, sensitive: true },
    { label: "Clients actifs", value: data.activeClients, delta: 0, trend: "up" as const, spark: data.perfClients, icon: Users, sensitive: true },
    { label: "Acomptes en attente", value: data.pendingDeposits, prefix: "MAD", delta: 0, trend: "down" as const, spark: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, data.pendingDeposits > 0 ? 5 : 1], icon: Clock, sensitive: true },
    { label: "Paiements encaissés", value: data.paymentsReceived, prefix: "MAD", delta: 0, trend: "up" as const, spark: data.perfPayments, icon: Banknote, sensitive: true },
  ], [data]);

  return (
    <>
      <div className="mt-8 grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-9 space-y-6">
          <KpiGrid kpis={KPIS} />
          <RevenueChart
            weekData={data.revenueWeek}
            weekLabels={data.revenueWeekLabels}
            monthData={data.revenueMonth}
            monthLabels={data.revenueMonthLabels}
            yearData={data.revenueYear}
            yearLabels={data.revenueYearLabels}
            total={data.revenue}
            growth={data.health.monthlyGrowth}
          />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3"><RecentCommandes commandes={data.recentCommandes} /></div>
            <div className="lg:col-span-2"><PaymentsCard paid={data.paymentsReceived} pending={data.pendingDeposits} remaining={data.totalBudget - data.paymentsReceived - data.pendingDeposits} /></div>
          </div>
          <UpcomingEvents events={data.upcomingEvents} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MiniCalendar />
            <BusinessHealth health={data.health} />
          </div>
          <QuickActions />
          <PerformanceCharts perfRevenue={data.perfRevenue} perfEvents={data.perfEvents} perfClients={data.perfClients} />
        </div>

        <aside className="col-span-12 xl:col-span-3 space-y-6">
          <div className="xl:sticky xl:top-24 space-y-6">
            <TodayEvents events={data.todayEvents} />
            <AlertsCard alerts={data.alerts} />
            <ActivityFeed activity={data.activity} />
            <QuickStats stats={data.quickStats} />
          </div>
        </aside>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-12 gap-6 animate-pulse">
      <div className="col-span-12 xl:col-span-9 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 h-36" />
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 h-80" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 h-64" />
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 h-64" />
        </div>
      </div>
      <aside className="col-span-12 xl:col-span-3 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 h-48" />
        ))}
      </aside>
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="mt-16 flex flex-col items-center gap-4 text-muted-foreground">
      <AlertTriangle className="size-10" />
      <p className="font-display text-xl">Erreur de chargement</p>
      <p className="text-sm">{message}</p>
      <Button variant="outline" onClick={() => window.location.reload()}>Réessayer</Button>
    </div>
  );
}

/* ---------------- Header ---------------- */
const Header = memo(function Header() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Sparkles className="size-3.5 text-[var(--gold-deep)]" />
          <span>Aperçu en direct</span>
        </div>
        <h1 className="font-display text-5xl lg:text-6xl text-gradient-charcoal leading-[1.05]">
          Dashboard
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Bienvenue, voici un aperçu de votre activité.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur">
          <FileText className="size-4" /> Générer rapport
        </Button>
        <Button variant="outline" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur">
          <CalendarIcon className="size-4" /> Calendrier
        </Button>
        <EyeToggle />
        <Link href="/nouvelle-commande">
          <Button className="h-10 rounded-lg bg-gradient-charcoal text-white shadow-lift hover:opacity-95">
            <Plus className="size-4" /> Nouvelle commande
          </Button>
        </Link>
      </div>
    </div>
  );
});

/* ---------------- KPI grid ---------------- */
const KpiGrid = memo(function KpiGrid({ kpis }: { kpis: Array<any> }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((k, i) => (
        <KpiCard key={k.label} {...k} delay={i * 0.05} />
      ))}
    </div>
  );
});

const KpiCard = memo(function KpiCard({ label, value, prefix, delta, trend, spark, icon: Icon, accent, delay, sensitive }: any) {
  const counted = useCounter(value, 1400);
  const display = prefix ? mad(Math.round(counted)) : Math.round(counted).toLocaleString("fr-FR");
  const up = trend === "up";
  const { isPrivacyMode } = usePrivacyMode();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft hover:shadow-lift transition-all ${accent ? "border-gold" : "border-border"}`}
    >
      {accent && (
        <div className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-gradient-gold opacity-20 blur-2xl" />
      )}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-3 font-display text-4xl tabular-nums">
            <SensitiveValue hidden={sensitive && isPrivacyMode} className="text-gradient-charcoal">{display}</SensitiveValue>
          </div>
        </div>
        <div className={`size-10 rounded-xl flex items-center justify-center ${accent ? "bg-gradient-gold text-[var(--gold-foreground)]" : "bg-foreground/[0.04] text-foreground"}`}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${up ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
          {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {delta > 0 ? "+" : ""}{delta}%
        </div>
        <Sparkline data={spark} up={up} />
      </div>
    </motion.div>
  );
});

const Sparkline = memo(function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const w = 96, h = 32, pad = 2;
  const { path, fill, stroke } = useMemo(() => {
    const min = Math.min(...data), max = Math.max(...data);
    const pts = data.map((d, i) => {
      const x = pad + (i * (w - pad * 2)) / (data.length - 1);
      const y = h - pad - ((d - min) / Math.max(1, max - min)) * (h - pad * 2);
      return [x, y];
    });
    const p = pts.map((pt, i) => (i === 0 ? `M${pt[0]},${pt[1]}` : `L${pt[0]},${pt[1]}`)).join(" ");
    const f = `${p} L${w - pad},${h} L${pad},${h} Z`;
    const s = up ? "rgb(16 185 129)" : "rgb(244 63 94)";
    return { path: p, fill: f, stroke: s };
  }, [data, up, w, h, pad]);
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${up ? "u" : "d"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${up ? "u" : "d"})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

/* ---------------- Revenue chart ---------------- */
const RevenueChart = memo(function RevenueChart({
  weekData, weekLabels, monthData, monthLabels, yearData, yearLabels, total, growth,
}: {
  weekData: number[]; weekLabels: string[];
  monthData: number[]; monthLabels: string[];
  yearData: number[]; yearLabels: string[];
  total: number; growth: number;
}) {
  const { isPrivacyMode } = usePrivacyMode();
  const [range, setRange] = useState<"Semaine" | "Mois" | "Année">("Année");
  const data = range === "Semaine" ? weekData : range === "Mois" ? monthData : yearData;
  const labels = range === "Semaine" ? weekLabels : range === "Mois" ? monthLabels : yearLabels;
  const [hover, setHover] = useState<number | null>(null);
  const [w, h, padX, padY] = [800, 260, 28, 24];

  const { pts, path, fill } = useMemo(() => {
    if (data.length < 2) {
      return { pts: [], path: '', fill: '' };
    }
    const mx = Math.max(...data, 1) * 1.15;
    const mn = 0;
    const p = data.map((d, i) => {
      const x = padX + (i * (w - padX * 2)) / (data.length - 1);
      const y = h - padY - ((d - mn) / (mx - mn)) * (h - padY * 2);
      return [x, y];
    });
    const pa = p.map((pt, i) => (i === 0 ? `M${pt[0]},${pt[1]}` : `L${pt[0]},${pt[1]}`)).join(" ");
    const fi = `${pa} L${p[p.length - 1][0]},${h - padY} L${p[0][0]},${h - padY} Z`;
    return { pts: p, path: pa, fill: fi };
  }, [data, w, h, padX, padY]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card shadow-soft p-6"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Évolution du chiffre d'affaires</div>
          <div className="mt-2 flex items-baseline gap-3">
            <div className="font-display text-4xl tabular-nums">
              <SensitiveValue hidden={isPrivacyMode} className="text-gradient-charcoal">{mad(total)}</SensitiveValue>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-md inline-flex items-center gap-1 ${growth >= 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
              {growth >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              <SensitiveValue hidden={isPrivacyMode}>{growth >= 0 ? "+" : ""}{growth}%</SensitiveValue>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-foreground/[0.04] border border-border">
          {(["Semaine", "Mois", "Année"] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 h-8 text-xs rounded-md transition-colors ${range === r ? "bg-background shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[260px]">
          <defs>
            <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.72 0.13 78)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="oklch(0.72 0.13 78)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="rev-stroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="oklch(0.40 0.012 70)" />
              <stop offset="100%" stopColor="oklch(0.65 0.13 78)" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line key={t} x1={padX} x2={w - padX} y1={padY + t * (h - padY * 2)} y2={padY + t * (h - padY * 2)}
              stroke="oklch(0.20 0.012 70 / 0.06)" strokeDasharray="2 4" />
          ))}
          {path && (
            <>
              <motion.path d={fill} fill="url(#rev-fill)"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
              <motion.path d={path} fill="none" stroke="url(#rev-stroke)" strokeWidth={2.5}
                strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} />
            </>
          )}

          {pts.map((p, i) => (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={p[0] - (w / Math.max(1, data.length)) / 2} y={0} width={w / Math.max(1, data.length)} height={h} fill="transparent" />
              {hover === i && (
                <>
                  <line x1={p[0]} x2={p[0]} y1={padY} y2={h - padY} stroke="oklch(0.20 0.012 70 / 0.2)" strokeDasharray="3 3" />
                  <circle cx={p[0]} cy={p[1]} r={5} fill="white" stroke="oklch(0.65 0.13 78)" strokeWidth={2} />
                </>
              )}
            </g>
          ))}
        </svg>

        {hover !== null && data[hover] > 0 && (
          <div className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
            style={{ left: `${(pts[hover][0] / w) * 100}%`, top: `${(pts[hover][1] / h) * 100}%` }}>
            <div className="mb-3 px-3 py-2 rounded-lg bg-foreground text-background text-xs shadow-lift whitespace-nowrap">
              <div className="opacity-70">{labels[hover]}</div>
              <div className="font-medium tabular-nums"><SensitiveValue hidden={isPrivacyMode}>{mad(data[hover])}</SensitiveValue></div>
            </div>
          </div>
        )}

        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground px-7">
          {labels.filter((_, i) => i % Math.ceil(labels.length / 8) === 0).map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

/* ---------------- Recent commandes ---------------- */
const RecentCommandes = memo(function RecentCommandes({ commandes }: { commandes: DashboardData['recentCommandes'] }) {
  const { isPrivacyMode } = usePrivacyMode();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Activité</div>
          <h3 className="font-display text-2xl mt-1">Commandes récentes</h3>
        </div>
        <button className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          Voir tout <ArrowRight className="size-3" />
        </button>
      </div>
      <div className="divide-y divide-border">
        <div className="grid grid-cols-12 px-6 py-3 text-[10px] uppercase tracking-wider text-muted-foreground bg-foreground/[0.02]">
          <div className="col-span-3">Commande</div>
          <div className="col-span-3">Client</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-2 text-right">Statut</div>
        </div>
        {commandes.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Aucune commande récente</div>
        )}
        {commandes.map((c, i) => (
          <motion.div key={c.id}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
            className="grid grid-cols-12 items-center px-6 py-4 hover:bg-foreground/[0.02] transition-colors group cursor-pointer">
            <div className="col-span-3 text-sm font-medium tabular-nums">{c.number}</div>
            <div className="col-span-3 flex items-center gap-2 text-sm truncate">
              <div className="size-7 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center text-[10px] font-medium shrink-0">
                {c.clientName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <span className="truncate">{c.clientName}</span>
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">
              {new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
            <div className="col-span-2 text-sm font-medium text-right tabular-nums">
              <SensitiveValue hidden={isPrivacyMode}>{mad(c.total)}</SensitiveValue>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-2">
              <span className={`whitespace-nowrap text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLES[COMMANDE_STATUS_LABELS[c.status]] || 'bg-foreground/[0.05]'}`}>
                {COMMANDE_STATUS_LABELS[c.status] || c.status}
              </span>
              <ChevronRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

/* ---------------- Payments ---------------- */
const PaymentsCard = memo(function PaymentsCard({ paid, pending, remaining }: { paid: number; pending: number; remaining: number }) {
  const { isPrivacyMode } = usePrivacyMode();
  const total = paid + pending + remaining;
  const pct = (n: number) => Math.round((n / Math.max(1, total)) * 100);
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Paiements</div>
          <h3 className="font-display text-2xl mt-1">Suivi financier</h3>
        </div>
        <Wallet className="size-5 text-muted-foreground" />
      </div>

      <div className="mt-6 h-3 w-full rounded-full bg-foreground/[0.05] overflow-hidden flex">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct(paid)}%` }} transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct(pending)}%` }} transition={{ duration: 1, delay: 0.2 }}
          className="h-full bg-gradient-gold" />
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct(remaining)}%` }} transition={{ duration: 1, delay: 0.4 }}
          className="h-full bg-foreground/20" />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        <SensitiveValue hidden={isPrivacyMode}>{pct(paid)}% encaissé sur {mad(total)}</SensitiveValue>
      </div>

      <div className="mt-6 space-y-4">
        {[
          { label: "Payés", value: paid, color: "bg-emerald-500" },
          { label: "En attente", value: pending, color: "bg-[var(--gold-deep)]" },
          { label: "Restant dû", value: remaining, color: "bg-foreground/40" },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className={`size-2 rounded-full ${r.color}`} />
              {r.label}
            </div>
            <div className="text-sm font-medium tabular-nums"><SensitiveValue hidden={isPrivacyMode}>{mad(r.value)}</SensitiveValue></div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="mt-6 w-full h-9 rounded-lg">
        Relancer les paiements <ArrowUpRight className="size-3.5" />
      </Button>
    </div>
  );
});

/* ---------------- Upcoming events ---------------- */
const UpcomingEvents = memo(function UpcomingEvents({ events }: { events: DashboardData['upcomingEvents'] }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Agenda</div>
          <h3 className="font-display text-2xl mt-1">Prochains événements</h3>
        </div>
        <Link href="/dashboard/events" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          Tout voir <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {events.length === 0 && (
          <div className="col-span-3 py-8 text-center text-sm text-muted-foreground">Aucun événement à venir</div>
        )}
        {events.map((e, i) => {
          const daysUntil = Math.ceil((new Date(e.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const accent = e.status === 'CONFIRMED';
          return (
            <motion.div key={e.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`group relative rounded-xl border p-5 overflow-hidden transition-all hover:shadow-lift ${accent ? "border-gold bg-gradient-to-br from-[var(--gold-soft)]/60 to-transparent" : "border-border bg-card"}`}>
              {accent && <div className="absolute -top-12 -right-12 size-32 rounded-full bg-gradient-gold opacity-20 blur-2xl" />}
              <div className="flex items-start justify-between">
                <PartyPopper className={`size-5 ${accent ? "text-[var(--gold-deep)]" : "text-muted-foreground"}`} />
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${EVENT_STATUS_STYLES[e.status] || "bg-foreground/[0.05] text-muted-foreground"}`}>
                  {EVENT_STATUS_LABELS[e.status] || e.status}
                </span>
              </div>
              <div className="mt-4 font-display text-xl leading-tight">{e.name}</div>
              {e.clientName && <div className="mt-1 text-xs text-muted-foreground">{e.clientName}</div>}
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {new Date(e.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {e.guestCount && (
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <Users className="size-3" /> {e.guestCount}
                  </span>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Dans</span>
                <span className="font-display text-2xl tabular-nums">
                  {daysUntil < 0 ? 0 : daysUntil}
                  <span className="text-xs text-muted-foreground ml-1">jour{daysUntil > 1 ? 's' : ''}</span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

/* ---------------- Mini calendar ---------------- */
const CALENDAR_DAYS = Array.from({ length: 35 }, (_, i) => i - 1);
const CALENDAR_EVENTS: Record<number, "booked" | "busy" | "warning"> = {
  3: "booked", 7: "booked", 12: "busy", 14: "busy", 18: "booked",
  22: "warning", 28: "booked",
};

const MiniCalendar = memo(function MiniCalendar() {
  const today = 5;
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Calendrier</div>
          <h3 className="font-display text-2xl mt-1">Aperçu</h3>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] uppercase text-muted-foreground text-center mb-2">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {CALENDAR_DAYS.map((d, i) => {
          const valid = d > 0 && d <= 30;
          const ev = CALENDAR_EVENTS[d];
          const isToday = d === today;
          return (
            <div key={i}
              className={`relative aspect-square rounded-lg text-xs flex items-center justify-center cursor-pointer transition-all
                ${!valid ? "opacity-0" : ""}
                ${isToday ? "bg-foreground text-background font-medium" : "hover:bg-foreground/[0.04]"}
                ${ev === "busy" && !isToday ? "bg-[var(--gold-soft)]" : ""}
                ${ev === "warning" && !isToday ? "bg-rose-50 ring-1 ring-rose-200" : ""}
              `}>
              {valid && d}
              {ev && !isToday && (
                <span className={`absolute bottom-1 size-1 rounded-full ${ev === "booked" ? "bg-emerald-500" : ev === "busy" ? "bg-[var(--gold-deep)]" : "bg-rose-500"}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" /> Réservé</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[var(--gold-deep)]" /> Chargé</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-rose-500" /> Conflit</span>
      </div>
    </div>
  );
});

/* ---------------- Business health ---------------- */
const BusinessHealth = memo(function BusinessHealth({ health }: { health: DashboardData['health'] }) {
  const { isPrivacyMode } = usePrivacyMode();
  const items = useMemo(() => [
    { label: "Valeur moyenne / événement", value: mad(health.avgEventValue), delta: "CA global", icon: TrendingUp, sensitive: true },
    { label: "Acompte moyen", value: mad(health.avgDeposit), delta: health.monthlyGrowth >= 0 ? `+${health.monthlyGrowth}%` : `${health.monthlyGrowth}%`, icon: Wallet, sensitive: true },
    { label: "Menu le plus commandé", value: health.topMenuItem || "Aucun", delta: health.topMenuCount ? `${health.topMenuCount} commandes` : "", icon: Utensils, sensitive: false },
    { label: "Meilleur client", value: health.bestClientName || "Aucun", delta: health.bestClientTotal ? mad(health.bestClientTotal) : "", icon: Crown, sensitive: true },
    { label: "Croissance mensuelle", value: health.monthlyGrowth >= 0 ? `+${health.monthlyGrowth}%` : `${health.monthlyGrowth}%`, delta: "vs mois précédent", icon: Activity, sensitive: true },
    { label: "Nombre total d'événements", value: "0", delta: "", icon: CalendarIcon, sensitive: false },
  ], [health]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="mb-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Analytics</div>
        <h3 className="font-display text-2xl mt-1">Santé de l'activité</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((h, i) => (
          <motion.div key={h.label}
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-border bg-[var(--surface-elevated)] p-4 hover:shadow-soft transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                <h.icon className="size-3.5" />
              </div>
              {h.delta && <span className="text-[10px] text-emerald-700">{h.delta}</span>}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{h.label}</div>
            <div className="mt-1 text-sm font-medium truncate">
              <SensitiveValue hidden={h.sensitive && isPrivacyMode}>{h.value}</SensitiveValue>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

/* ---------------- Quick actions ---------------- */
const ACTIONS = [
  { label: "Nouvelle commande", icon: Plus, to: "/nouvelle-commande", primary: true },
  { label: "Nouveau client", icon: UserPlus, to: "/dashboard/clients" },
  { label: "Nouveau menu", icon: Utensils, to: "/dashboard/menus" },
  { label: "Événements", icon: PartyPopper, to: "/dashboard/events" },
  { label: "Ouvrir calendrier", icon: CalendarIcon },
];

const QuickActions = memo(function QuickActions() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="mb-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Raccourcis</div>
        <h3 className="font-display text-2xl mt-1">Actions rapides</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ACTIONS.map((a) => {
          const inner = (
            <motion.div whileHover={{ y: -3 }}
              className={`group h-full rounded-xl border p-4 flex flex-col items-start gap-3 transition-all cursor-pointer
                ${a.primary ? "border-gold bg-gradient-to-br from-[var(--gold-soft)]/50 to-transparent hover:shadow-gold" : "border-border bg-[var(--surface-elevated)] hover:shadow-soft"}`}>
              <div className={`size-9 rounded-lg flex items-center justify-center ${a.primary ? "bg-gradient-charcoal text-white" : "bg-foreground/[0.04]"}`}>
                <a.icon className="size-4" />
              </div>
              <div className="text-sm font-medium">{a.label}</div>
              <ArrowUpRight className="size-3.5 text-muted-foreground ml-auto -mt-2 opacity-0 group-hover:opacity-100 transition" />
            </motion.div>
          );
          return a.to ? <Link key={a.label} href={a.to}>{inner}</Link> : <div key={a.label}>{inner}</div>;
        })}
      </div>
    </div>
  );
});

/* ---------------- Performance charts ---------------- */
const PERF_COLORS = [
  "oklch(0.65 0.13 78)",
  "oklch(0.45 0.05 240)",
  "oklch(0.55 0.12 160)",
  "oklch(0.50 0.10 20)",
];

const PerformanceCharts = memo(function PerformanceCharts({
  perfRevenue, perfEvents, perfClients,
}: {
  perfRevenue: number[];
  perfEvents: number[];
  perfClients: number[];
}) {
  const charts = useMemo(() => [
    { label: "Revenue", data: perfRevenue, color: PERF_COLORS[0] },
    { label: "Événements", data: perfEvents, color: PERF_COLORS[1] },
    { label: "Clients", data: perfClients, color: PERF_COLORS[2] },
    { label: "Paiements", data: perfRevenue, color: PERF_COLORS[3] },
  ], [perfRevenue, perfEvents, perfClients]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Performance</div>
          <h3 className="font-display text-2xl mt-1">Vue d'ensemble — 8 derniers mois</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {charts.map((c, ci) => {
          const max = Math.max(...c.data, 1);
          return (
            <motion.div key={c.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.08 }}
              className="rounded-xl border border-border p-4 bg-[var(--surface-elevated)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{c.label}</span>
                {c.data.length > 0 && (
                  <span className="text-xs font-medium text-emerald-700">
                    {c.data[c.data.length - 1] > c.data[0] ? '+' : ''}
                    {c.data.length > 1 ? Math.round(((c.data[c.data.length - 1] - c.data[0]) / Math.max(1, c.data[0])) * 100) : 0}%
                  </span>
                )}
              </div>
              <div className="flex items-end gap-1 h-20">
                {c.data.map((v, i) => (
                  <motion.div key={i}
                    initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                    className="flex-1 rounded-t-sm"
                    style={{ background: `linear-gradient(180deg, ${c.color}, ${c.color}55)` }} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

/* ---------------- Right rail: today events ---------------- */
const TodayEvents = memo(function TodayEvents({ events }: { events: DashboardData['todayEvents'] }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Aujourd'hui</div>
          <h3 className="font-display text-xl mt-1">Programme du jour</h3>
        </div>
        <span className="text-xs text-muted-foreground">{events.length}</span>
      </div>
      {events.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          Aucun événement programmé aujourd'hui
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((ev, i) => {
            const d = new Date(ev.startDate);
            const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            return (
              <motion.div key={ev.id}
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-foreground/[0.03] cursor-pointer"
                onClick={() => { window.location.href = `/dashboard/events/${ev.id}`; }}>
                <div className="text-xs tabular-nums text-muted-foreground w-12 pt-0.5">{time}</div>
                <div className="relative flex-1 pl-3 border-l-2 border-[var(--gold)]/40">
                  <div className="text-sm font-medium leading-tight">{ev.name}</div>
                  {ev.guestCount && <div className="text-[10px] text-muted-foreground mt-0.5">{ev.guestCount} pax</div>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
});

/* ---------------- Alerts ---------------- */
const AlertsCard = memo(function AlertsCard({ alerts }: { alerts: DashboardData['alerts'] }) {
  const { isPrivacyMode } = usePrivacyMode();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Vigilance</div>
          <h3 className="font-display text-xl mt-1">Alertes</h3>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700">{alerts.length}</span>
      </div>
      <div className="space-y-2">
        {alerts.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Aucune alerte
          </div>
        )}
        {alerts.map((a, i) => {
          const Icon = a.type === "danger" ? AlertTriangle : a.type === "warn" ? Clock : AlertTriangle;
          const tone =
            a.type === "danger" ? "bg-rose-50/60 border-rose-200/60 text-rose-900" :
              a.type === "warn" ? "bg-amber-50/60 border-amber-200/60 text-amber-900" :
                "bg-blue-50/60 border-blue-200/60 text-blue-900";
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`rounded-xl border p-3 flex items-start gap-3 ${tone}`}>
              <Icon className="size-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs opacity-80 truncate">
                  {a.type === 'warn' ? <SensitiveValue hidden={isPrivacyMode}>{a.text}</SensitiveValue> : a.text}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

/* ---------------- Activity feed ---------------- */
const ActivityFeed = memo(function ActivityFeed({ activity }: { activity: DashboardData['activity'] }) {
  const { isPrivacyMode } = usePrivacyMode();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Temps réel</div>
          <h3 className="font-display text-xl mt-1">Activité récente</h3>
        </div>
      </div>
      <div className="relative space-y-3">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
        {activity.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">Aucune activité récente</div>
        )}
        {activity.map((f, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="relative pl-6">
            <CircleDot className="absolute left-0 top-1 size-3.5 text-[var(--gold-deep)] bg-card rounded-full" />
            <div className="text-xs leading-snug">
              <span className="font-medium">{f.who}</span>{" "}
              <span className="text-muted-foreground">{f.action}</span>{" "}
              {f.financial ? (
                <SensitiveValue hidden={isPrivacyMode} as="span" className="font-medium">{f.target}</SensitiveValue>
              ) : (
                <span className="font-medium">{f.target}</span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{f.time}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

/* ---------------- Quick stats ---------------- */
const QuickStats = memo(function QuickStats({ stats }: { stats: DashboardData['quickStats'] }) {
  const { isPrivacyMode } = usePrivacyMode();
  const items = useMemo(() => [
    { label: "Budget moyen", value: mad(stats.avgBudget) },
    { label: "Invités moyen", value: stats.avgGuests > 0 ? `${stats.avgGuests} pax` : "0 pax" },
    { label: "Taux de réalisation", value: `${stats.completionRate}%` },
  ], [stats]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Indicateurs</div>
        <h3 className="font-display text-xl mt-1">Stats rapides</h3>
      </div>
      <div className="space-y-4">
        {items.map((s, i) => {
          const isPercent = s.value.endsWith('%');
          const numVal = isPercent ? parseInt(s.value) : 50;
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium tabular-nums"><SensitiveValue hidden={isPrivacyMode}>{s.value}</SensitiveValue></span>
              </div>
              {isPercent && (
                <div className="h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${numVal}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                    className="h-full bg-gradient-gold" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-600" /> Données mises à jour
        </div>
      </div>
    </div>
  );
});
