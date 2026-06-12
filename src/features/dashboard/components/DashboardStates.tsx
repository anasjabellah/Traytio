'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardSkeleton() {
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

export function DashboardError({ message }: { message: string }) {
  return (
    <div className="mt-16 flex flex-col items-center gap-4 text-muted-foreground">
      <AlertTriangle className="size-10" />
      <p className="font-display text-xl">Erreur de chargement</p>
      <p className="text-sm">{message}</p>
      <Button variant="outline" onClick={() => window.location.reload()}>R&eacute;essayer</Button>
    </div>
  );
}
