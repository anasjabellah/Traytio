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



export default function Page() {
  return <Dashboard />;
}

/* ---------------- Module-level static data ---------------- */
const PERF_CHARTS = [
  { label: "Revenue", data: [12, 18, 16, 24, 22, 30, 34, 40], color: "oklch(0.65 0.13 78)" },
  { label: "Événements", data: [3, 5, 4, 6, 7, 8, 9, 12], color: "oklch(0.45 0.05 240)" },
  { label: "Clients", data: [40, 50, 60, 72, 84, 96, 110, 142], color: "oklch(0.55 0.12 160)" },
  { label: "Paiements", data: [8, 10, 14, 18, 22, 28, 32, 38], color: "oklch(0.50 0.10 20)" },
];
const QUICK_STATS = [
  { label: "Taux de conversion devis", value: 68 },
  { label: "Satisfaction client", value: 96 },
  { label: "Capacité utilisée (mois)", value: 74 },
];
const TODAY_ITEMS = [
  { time: "10:30", name: "Dégustation — Sophie L.", tag: "Showroom" },
  { time: "14:00", name: "Livraison Maison Rivière", tag: "Logistique" },
  { time: "18:30", name: "Cocktail Atelier Noé", tag: "Événement" },
];
const CALENDAR_DAYS = Array.from({ length: 35 }, (_, i) => i - 1);
const CALENDAR_EVENTS: Record<number, "booked" | "busy" | "warning"> = {
  3: "booked", 7: "booked", 12: "busy", 14: "busy", 18: "booked",
  22: "warning", 28: "booked",
};

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

const mad = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);

/* ---------------- Page ---------------- */
function Dashboard() {
  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      {/* Ambient mesh */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <Header />

        <div className="mt-8 grid grid-cols-12 gap-6">
          {/* Main column */}
          <div className="col-span-12 xl:col-span-9 space-y-6">
            <KpiGrid />
            <RevenueChart />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3"><RecentCommandes /></div>
              <div className="lg:col-span-2"><PaymentsCard /></div>
            </div>
            <UpcomingEvents />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MiniCalendar />
              <BusinessHealth />
            </div>
            <QuickActions />
            <PerformanceCharts />
          </div>

          {/* Right rail */}
          <aside className="col-span-12 xl:col-span-3 space-y-6">
            <div className="xl:sticky xl:top-24 space-y-6">
              <TodayEvents />
              <AlertsCard />
              <ActivityFeed />
              <QuickStats />
            </div>
          </aside>
        </div>

        <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Tous les services opérationnels
          </div>
          <div>© TUR — Suite traiteur premium</div>
        </footer>
      </div>
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
          <span>Aperçu en direct • mis à jour il y a 2 min</span>
        </div>
        <h1 className="font-display text-5xl lg:text-6xl text-gradient-charcoal leading-[1.05]">
          Dashboard
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Bienvenue Anas, voici un aperçu de votre activité aujourd'hui.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur">
          <FileText className="size-4" /> Générer rapport
        </Button>
        <Button variant="outline" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur">
          <CalendarIcon className="size-4" /> Calendrier
        </Button>
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
const KPIS = [
  { label: "Chiffre d'affaires", value: 1842500, prefix: "MAD", delta: 12.4, trend: "up", spark: [12, 18, 14, 22, 19, 28, 32, 30, 38, 42, 47, 54], icon: Wallet, accent: true },
  { label: "Commandes actives", value: 28, delta: 6.1, trend: "up", spark: [4, 6, 5, 7, 8, 7, 9, 8, 10, 11, 12, 14], icon: Receipt },
  { label: "Événements à venir", value: 14, delta: 2, trend: "up", spark: [2, 3, 2, 4, 4, 5, 5, 6, 6, 7, 7, 8], icon: PartyPopper },
  { label: "Clients actifs", value: 142, delta: 8.3, trend: "up", spark: [50, 58, 60, 65, 72, 78, 84, 92, 100, 112, 124, 142], icon: Users },
  { label: "Acomptes en attente", value: 184000, prefix: "MAD", delta: -3.2, trend: "down", spark: [40, 36, 38, 32, 30, 28, 32, 30, 26, 24, 22, 18], icon: Clock },
  { label: "Paiements encaissés", value: 968200, prefix: "MAD", delta: 14.7, trend: "up", spark: [20, 24, 28, 30, 36, 42, 48, 56, 64, 72, 82, 96], icon: Banknote },
];

const KpiGrid = memo(function KpiGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {KPIS.map((k, i) => (
        <KpiCard key={k.label} {...k} delay={i * 0.05} />
      ))}
    </div>
  );
});

const KpiCard = memo(function KpiCard({ label, value, prefix, delta, trend, spark, icon: Icon, accent, delay }: any) {
  const counted = useCounter(value, 1400);
  const display = prefix ? mad(Math.round(counted)) : Math.round(counted).toLocaleString("fr-FR");
  const up = trend === "up";
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
          <div className="mt-3 font-display text-4xl text-gradient-charcoal tabular-nums">{display}</div>
        </div>
        <div className={`size-10 rounded-xl flex items-center justify-center ${accent ? "bg-gradient-gold text-[var(--gold-foreground)]" : "bg-foreground/[0.04] text-foreground"}`}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${up ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
          {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {up ? "+" : ""}{delta}%
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
const REV_DATA: Record<string, number[]> = {
  Semaine: [3200, 4100, 3800, 5200, 4900, 6800, 7400],
  Mois: Array.from({ length: 30 }, (_, i) => 3000 + Math.round(Math.sin(i / 3) * 1200 + i * 180 + Math.sin(i * 3.7) * 300 + 300)),
  Année: [12, 14, 18, 17, 22, 26, 24, 30, 34, 40, 46, 52].map((n) => n * 1000),
};
const REV_LABELS: Record<string, string[]> = {
  Semaine: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
  Mois: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
  Année: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"],
};

const RevenueChart = memo(function RevenueChart() {
  const [range, setRange] = useState<"Semaine" | "Mois" | "Année">("Mois");
  const data = REV_DATA[range];
  const labels = REV_LABELS[range];
  const [hover, setHover] = useState<number | null>(null);
  const [w, h, padX, padY] = [800, 260, 28, 24];

  const { total, pts, path, fill } = useMemo(() => {
    const tot = data.reduce((a, b) => a + b, 0);
    const mx = Math.max(...data) * 1.15;
    const mn = 0;
    const p = data.map((d, i) => {
      const x = padX + (i * (w - padX * 2)) / (data.length - 1);
      const y = h - padY - ((d - mn) / (mx - mn)) * (h - padY * 2);
      return [x, y];
    });
    const pa = p.map((pt, i) => (i === 0 ? `M${pt[0]},${pt[1]}` : `L${pt[0]},${pt[1]}`)).join(" ");
    const fi = `${pa} L${p[p.length - 1][0]},${h - padY} L${p[0][0]},${h - padY} Z`;
    return { total: tot, pts: p, path: pa, fill: fi };
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
            <div className="font-display text-4xl text-gradient-charcoal tabular-nums">{mad(total)}</div>
            <span className="text-emerald-700 bg-emerald-50 text-xs font-medium px-2 py-1 rounded-md inline-flex items-center gap-1">
              <TrendingUp className="size-3" /> +18.4%
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
          <motion.path d={fill} fill="url(#rev-fill)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
          <motion.path d={path} fill="none" stroke="url(#rev-stroke)" strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} />

          {pts.map((p, i) => (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={p[0] - (w / data.length) / 2} y={0} width={w / data.length} height={h} fill="transparent" />
              {hover === i && (
                <>
                  <line x1={p[0]} x2={p[0]} y1={padY} y2={h - padY} stroke="oklch(0.20 0.012 70 / 0.2)" strokeDasharray="3 3" />
                  <circle cx={p[0]} cy={p[1]} r={5} fill="white" stroke="oklch(0.65 0.13 78)" strokeWidth={2} />
                </>
              )}
            </g>
          ))}
        </svg>

        {hover !== null && (
          <div className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
            style={{ left: `${(pts[hover][0] / w) * 100}%`, top: `${(pts[hover][1] / h) * 100}%` }}>
            <div className="mb-3 px-3 py-2 rounded-lg bg-foreground text-background text-xs shadow-lift whitespace-nowrap">
              <div className="opacity-70">{labels[hover]}</div>
              <div className="font-medium tabular-nums">{mad(data[hover])}</div>
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
const COMMANDES = [
  { id: "CMD-2841", client: "Sophie Lambert", date: "12 juin", total: 84200, status: "Confirmée", vip: true },
  { id: "CMD-2840", client: "Maison Rivière", date: "14 juin", total: 126400, status: "En cours", vip: false },
  { id: "CMD-2839", client: "Élise Moreau", date: "18 juin", total: 42800, status: "Devis", vip: true },
  { id: "CMD-2838", client: "Atelier Noé", date: "22 juin", total: 21500, status: "En attente", vip: false },
  { id: "CMD-2837", client: "Groupe Lumen", date: "28 juin", total: 189000, status: "Confirmée", vip: false },
];
const STATUS_STYLES: Record<string, string> = {
  "Confirmée": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
  "En cours": "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50",
  "Devis": "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50",
  "En attente": "bg-rose-50 text-rose-700 ring-1 ring-rose-200/50",
};

const RecentCommandes = memo(function RecentCommandes() {
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
        {COMMANDES.map((c, i) => (
          <motion.div key={c.id}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
            className="grid grid-cols-12 items-center px-6 py-4 hover:bg-foreground/[0.02] transition-colors group cursor-pointer">
            <div className="col-span-3 text-sm font-medium tabular-nums">{c.id}</div>
            <div className="col-span-3 flex items-center gap-2 text-sm">
              <div className="size-7 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center text-[10px] font-medium">
                {c.client.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <span className="truncate">{c.client}</span>
              {c.vip && <Crown className="size-3 text-[var(--gold-deep)]" />}
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">{c.date}</div>
            <div className="col-span-2 text-sm font-medium text-right tabular-nums">{mad(c.total)}</div>
            <div className="col-span-2 flex items-center justify-end gap-2">
              <span className={`whitespace-nowrap text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status]}`}>{c.status}</span>
              <ChevronRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

/* ---------------- Payments ---------------- */
const PaymentsCard = memo(function PaymentsCard() {
  const paid = 968200, pending = 184000, remaining = 246000;
  const total = paid + pending + remaining;
  const pct = (n: number) => Math.round((n / total) * 100);
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
        {pct(paid)}% encaissé sur {mad(total)}
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
            <div className="text-sm font-medium tabular-nums">{mad(r.value)}</div>
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
const EVENTS = [
  { name: "Mariage Sara & Yanis", client: "Sophie Lambert", date: "12 juin 2026", guests: 180, status: "Confirmé", days: 12, accent: true },
  { name: "Gala Maison Rivière", client: "Maison Rivière", date: "14 juin 2026", guests: 120, status: "Préparation", days: 14 },
  { name: "Cocktail Atelier Noé", client: "Atelier Noé", date: "22 juin 2026", guests: 60, status: "En attente", days: 22 },
];

const UpcomingEvents = memo(function UpcomingEvents() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Agenda</div>
          <h3 className="font-display text-2xl mt-1">Prochains événements</h3>
        </div>
        <Link href="/nouvelle-commande" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          Tout voir <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EVENTS.map((e, i) => (
          <motion.div key={e.name}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`group relative rounded-xl border p-5 overflow-hidden transition-all hover:shadow-lift ${e.accent ? "border-gold bg-gradient-to-br from-[var(--gold-soft)]/60 to-transparent" : "border-border bg-card"}`}>
            {e.accent && <div className="absolute -top-12 -right-12 size-32 rounded-full bg-gradient-gold opacity-20 blur-2xl" />}
            <div className="flex items-start justify-between">
              <PartyPopper className={`size-5 ${e.accent ? "text-[var(--gold-deep)]" : "text-muted-foreground"}`} />
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLES[e.status] ?? "bg-foreground/[0.05] text-muted-foreground"}`}>{e.status}</span>
            </div>
            <div className="mt-4 font-display text-xl leading-tight">{e.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{e.client}</div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{e.date}</span>
              <span className="inline-flex items-center gap-1 text-foreground">
                <Users className="size-3" /> {e.guests}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Dans</span>
              <span className="font-display text-2xl tabular-nums">{e.days}<span className="text-xs text-muted-foreground ml-1">jours</span></span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

/* ---------------- Mini calendar ---------------- */
const MiniCalendar = memo(function MiniCalendar() {
  const today = 5;
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Juin 2026</div>
          <h3 className="font-display text-2xl mt-1">Calendrier</h3>
        </div>
        <div className="flex gap-1">
          <button className="size-8 rounded-md border border-border hover:bg-foreground/[0.04] text-sm">‹</button>
          <button className="size-8 rounded-md border border-border hover:bg-foreground/[0.04] text-sm">›</button>
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
const HEALTH = [
  { label: "Valeur moyenne / événement", value: "62 400 MAD", delta: "+8.2%", icon: TrendingUp },
  { label: "Acompte moyen", value: "18 700 MAD", delta: "+3.1%", icon: Wallet },
  { label: "Plat le plus demandé", value: "Bastila pigeon", delta: "32 commandes", icon: Utensils },
  { label: "Pack vedette", value: "Wedding Premium", delta: "18 ventes", icon: Crown },
  { label: "Meilleur client", value: "Sophie Lambert", delta: "248 000 MAD", icon: Users },
  { label: "Croissance mensuelle", value: "+14.7%", delta: "vs mai", icon: Activity },
];

const BusinessHealth = memo(function BusinessHealth() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="mb-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Analytics</div>
        <h3 className="font-display text-2xl mt-1">Santé de l'activité</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {HEALTH.map((h, i) => (
          <motion.div key={h.label}
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-border bg-[var(--surface-elevated)] p-4 hover:shadow-soft transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                <h.icon className="size-3.5" />
              </div>
              <span className="text-[10px] text-emerald-700">{h.delta}</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{h.label}</div>
            <div className="mt-1 text-sm font-medium truncate">{h.value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

/* ---------------- Quick actions ---------------- */
const ACTIONS = [
  { label: "Nouvelle commande", icon: Plus, to: "/nouvelle-commande", primary: true },
  { label: "Nouveau client", icon: UserPlus },
  { label: "Nouveau menu", icon: Utensils },
  { label: "Nouveau devis", icon: FileSignature },
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
const PerformanceCharts = memo(function PerformanceCharts() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Performance</div>
          <h3 className="font-display text-2xl mt-1">Vue d'ensemble — 8 derniers mois</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PERF_CHARTS.map((c, ci) => (
          <motion.div key={c.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.08 }}
            className="rounded-xl border border-border p-4 bg-[var(--surface-elevated)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <span className="text-xs font-medium text-emerald-700">+{12 + ci * 3}%</span>
            </div>
            <div className="flex items-end gap-1 h-20">
              {c.data.map((v, i) => {
                const max = Math.max(...c.data);
                return (
                  <motion.div key={i}
                    initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                    className="flex-1 rounded-t-sm"
                    style={{ background: `linear-gradient(180deg, ${c.color}, ${c.color}55)` }} />
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

/* ---------------- Right rail: today events ---------------- */
const TodayEvents = memo(function TodayEvents() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Aujourd'hui</div>
          <h3 className="font-display text-xl mt-1">Programme du jour</h3>
        </div>
        <span className="text-xs text-muted-foreground">{TODAY_ITEMS.length}</span>
      </div>
      <div className="space-y-1">
        {TODAY_ITEMS.map((it, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-foreground/[0.03] cursor-pointer">
            <div className="text-xs tabular-nums text-muted-foreground w-12 pt-0.5">{it.time}</div>
            <div className="relative flex-1 pl-3 border-l-2 border-[var(--gold)]/40">
              <div className="text-sm font-medium leading-tight">{it.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{it.tag}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

/* ---------------- Alerts ---------------- */
const ALERTS = [
  { type: "warn", icon: AlertTriangle, title: "Acompte en retard", text: "Atelier Noé — 18 500 MAD", time: "il y a 2h" },
  { type: "info", icon: Clock, title: "Événement dans 3 jours", text: "Gala Maison Rivière", time: "demain" },
  { type: "danger", icon: AlertTriangle, title: "Risque double booking", text: "22 juin — 2 événements", time: "à vérifier" },
];
const AlertsCard = memo(function AlertsCard() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Vigilance</div>
          <h3 className="font-display text-xl mt-1">Alertes</h3>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700">{ALERTS.length}</span>
      </div>
      <div className="space-y-2">
        {ALERTS.map((a, i) => {
          const tone =
            a.type === "danger" ? "bg-rose-50/60 border-rose-200/60 text-rose-900" :
              a.type === "warn" ? "bg-amber-50/60 border-amber-200/60 text-amber-900" :
                "bg-blue-50/60 border-blue-200/60 text-blue-900";
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`rounded-xl border p-3 flex items-start gap-3 ${tone}`}>
              <a.icon className="size-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs opacity-80 truncate">{a.text}</div>
              </div>
              <span className="text-[10px] opacity-70 whitespace-nowrap">{a.time}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

/* ---------------- Activity feed ---------------- */
const FEED = [
  { who: "Anas", action: "a créé la commande", target: "CMD-2841", time: "à l'instant" },
  { who: "Ahmed", action: "a généré un PDF pour", target: "Maison Rivière", time: "il y a 12 min" },
  { who: "Sara", action: "a payé l'acompte —", target: "12 500 MAD", time: "il y a 38 min" },
  { who: "Système", action: "a envoyé un rappel à", target: "Atelier Noé", time: "il y a 1h" },
  { who: "Anas", action: "a confirmé l'événement", target: "Gala Lumen", time: "il y a 2h" },
];
const ActivityFeed = memo(function ActivityFeed() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Temps réel</div>
          <h3 className="font-display text-xl mt-1">Activité de l'équipe</h3>
        </div>
      </div>
      <div className="relative space-y-3">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
        {FEED.map((f, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="relative pl-6">
            <CircleDot className="absolute left-0 top-1 size-3.5 text-[var(--gold-deep)] bg-card rounded-full" />
            <div className="text-xs leading-snug">
              <span className="font-medium">{f.who}</span>{" "}
              <span className="text-muted-foreground">{f.action}</span>{" "}
              <span className="font-medium">{f.target}</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{f.time}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

/* ---------------- Quick stats ---------------- */
const QuickStats = memo(function QuickStats() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Indicateurs</div>
        <h3 className="font-display text-xl mt-1">Stats rapides</h3>
      </div>
      <div className="space-y-4">
        {QUICK_STATS.map((s, i) => (
          <div key={s.label}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-medium tabular-nums">{s.value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${s.value}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                className="h-full bg-gradient-gold" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-600" /> Compte premium actif
        </div>
        <button className="text-xs text-foreground hover:underline">Gérer</button>
      </div>
    </div>
  );
});