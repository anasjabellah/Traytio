'use client';

import { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Calendar as CalendarIcon, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EyeToggle } from '@/components/privacy-mode';
import { ReportModal } from '@/features/dashboard/components/report-modal';

export const DashboardHeader = memo(function DashboardHeader() {
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);

  const handleOpenReport = useCallback(() => setReportOpen(true), []);

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Sparkles className="size-3.5 text-[var(--gold-deep)]" />
            <span>Aper&ccedil;u en direct</span>
          </div>
          <h1 className="font-display text-5xl lg:text-6xl text-gradient-charcoal leading-[1.05]">
            Dashboard
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Bienvenue, voici un aper&ccedil;u de votre activit&eacute;.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-lg border-border bg-background/60 backdrop-blur"
            onClick={handleOpenReport}
          >
            <FileText className="size-4" /> G&eacute;n&eacute;rer rapport
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-lg border-border bg-background/60 backdrop-blur"
            onClick={() => router.push('/dashboard/calendar')}
          >
            <CalendarIcon className="size-4" /> Calendrier
          </Button>
          <EyeToggle />
          <Link href="/dashboard/commandes/new">
            <Button className="h-10 rounded-lg bg-gradient-charcoal text-white shadow-lift hover:opacity-95">
              <Plus className="size-4" /> Nouvelle commande
            </Button>
          </Link>
        </div>
      </div>

      <ReportModal open={reportOpen} onOpenChange={setReportOpen} />
    </>
  );
});
