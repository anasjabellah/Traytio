'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Loader2,
  CalendarIcon,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { generateReportData, type ReportData, type ReportFilters } from '../actions/generate-report-data';

type Preset = 'today' | '7days' | 'month' | 'year' | 'custom';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7days', label: '7 derniers jours' },
  { value: 'month', label: 'Ce mois' },
  { value: 'year', label: 'Cette année' },
  { value: 'custom', label: 'Personnalisé' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'QUOTED', label: 'Devis' },
  { value: 'CONFIRMED', label: 'Confirmée' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'READY', label: 'Prête' },
  { value: 'DELIVERED', label: 'Livrée' },
  { value: 'CANCELLED', label: 'Annulée' },
];

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'WEDDING', label: 'Mariage' },
  { value: 'CORPORATE', label: 'Corporate' },
  { value: 'BIRTHDAY', label: 'Anniversaire' },
  { value: 'ANNIVERSARY', label: 'Fête' },
  { value: 'HOLIDAY', label: 'Vacances' },
  { value: 'OTHER', label: 'Autre' },
];

function getDateRange(preset: Preset): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  switch (preset) {
    case 'today': {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { dateFrom: s.toISOString().slice(0, 10) };
    }
    case '7days': {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { dateFrom: s.toISOString().slice(0, 10) };
    }
    case 'month':
      return { dateFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10) };
    case 'year':
      return { dateFrom: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10) };
    case 'custom':
      return {};
  }
}

export function ReportModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [preset, setPreset] = useState<Preset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [status, setStatus] = useState('');
  const [eventType, setEventType] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleGenerate = useCallback(async () => {
    const range = preset === 'custom' ? { dateFrom: customFrom, dateTo: customTo } : getDateRange(preset);
    if (preset === 'custom' && !customFrom) {
      toast.error('Veuillez sélectionner une date de début');
      return;
    }
    setLoading(true);
    setReport(null);
    const filters: ReportFilters = { ...range, status: status || undefined, eventType: eventType || undefined };
    const res = await generateReportData(filters);
    setLoading(false);
    if (res.success && res.data) {
      setReport(res.data);
      toast.success(`Rapport généré : ${res.data.summary.totalCommandes} commandes`);
    } else {
      toast.error(res.error ?? 'Erreur lors de la génération du rapport');
    }
  }, [preset, customFrom, customTo, status, eventType]);

  const handleDownloadCSV = useCallback(() => {
    if (!report) return;
    setExporting(true);
    // Use setTimeout to let the UI update with the loading state before the sync CSV build
    setTimeout(() => {
      const header = 'Numéro;Statut;Client;Événement;Type;Date événement;Invites;Total;Payé;Restant;Créé le';
      const rows = report.rows.map((r) =>
        [
          r.number,
          r.status,
          r.clientName,
          r.eventName ?? '',
          r.eventType ?? '',
          r.eventDate ? new Date(r.eventDate).toLocaleDateString('fr-FR') : '',
          r.guestCount ?? '',
          r.totalAmount,
          r.paidAmount,
          r.remainingAmount,
          new Date(r.createdAt).toLocaleDateString('fr-FR'),
        ].join(';'),
      );
      const csv = '\uFEFF' + header + '\n' + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExporting(false);
      toast.success('Rapport téléchargé (CSV)');
    }, 50);
  }, [report]);

  const reset = useCallback(() => {
    setPreset('month');
    setCustomFrom('');
    setCustomTo('');
    setStatus('');
    setEventType('');
    setReport(null);
    setLoading(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(reset, 200); }}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                <FileText className="size-5 text-[var(--gold-foreground)]" strokeWidth={1.6} />
              </div>
              <div>
                <DialogTitle className="text-xl font-display">Générer un rapport</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Analysez vos commandes sur une période donnée
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-4 space-y-5">
          {/* Date presets */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-wider">
              <CalendarIcon className="size-3" strokeWidth={1.6} />
              Période
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPreset(p.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    preset === p.value
                      ? 'bg-gradient-charcoal text-white shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset === 'custom' && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-muted-foreground mb-1">Du</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-muted-foreground mb-1">Au</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wider">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold appearance-none"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wider">Type d&apos;événement</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold appearance-none"
              >
                {EVENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full h-11 rounded-xl bg-gradient-charcoal text-white shadow-lift hover:opacity-90 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                Génération en cours...
              </>
            ) : (
              <>
                <FileText className="size-4" strokeWidth={2} />
                Générer le rapport
              </>
            )}
          </Button>

          {/* Report result */}
          <AnimatePresence>
            {report && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5 space-y-3"
              >
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="size-4" strokeWidth={2} />
                  <span className="text-sm font-semibold">Rapport prêt</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-white/70 p-3 text-center">
                    <div className="text-xs text-muted-foreground">Commandes</div>
                    <div className="text-lg font-semibold mt-0.5">{report.summary.totalCommandes}</div>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3 text-center">
                    <div className="text-xs text-muted-foreground">Revenu total</div>
                    <div className="text-lg font-semibold mt-0.5">
                      {report.summary.totalRevenue.toLocaleString('fr-FR')} MAD
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3 text-center">
                    <div className="text-xs text-muted-foreground">Payé</div>
                    <div className="text-lg font-semibold mt-0.5 text-emerald-600">
                      {report.summary.totalPaid.toLocaleString('fr-FR')} MAD
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3 text-center">
                    <div className="text-xs text-muted-foreground">Moyenne</div>
                    <div className="text-lg font-semibold mt-0.5">
                      {report.summary.averageOrder.toLocaleString('fr-FR')} MAD
                    </div>
                  </div>
                </div>

                {/* Status breakdown */}
                {Object.keys(report.summary.statusBreakdown).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(report.summary.statusBreakdown).map(([key, count]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/70 text-[11px] font-medium text-muted-foreground"
                      >
                        {key} <span className="text-foreground font-semibold">{count}</span>
                      </span>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleDownloadCSV}
                  className="w-full h-10 rounded-xl gap-2 border-border/60"
                  variant="outline"
                  disabled={exporting}
                  aria-busy={exporting}
                >
                  {exporting ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <Download className="size-4" strokeWidth={2} />}
                  {exporting ? "Exportation..." : "Télécharger le rapport (CSV)"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error / empty state */}
          {!loading && !report && (
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-5 flex flex-col items-center gap-2 text-center">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                <AlertTriangle className="size-4 text-muted-foreground/50" strokeWidth={1.6} />
              </div>
              <p className="text-xs text-muted-foreground">
                Sélectionnez une période et cliquez sur &quot;Générer le rapport&quot;
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
