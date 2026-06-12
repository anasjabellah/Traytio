'use client';

import { Button } from '@/components/ui/button';
import { EyeToggle } from '@/components/privacy-mode';
import { Plus, FileText, Sparkles } from 'lucide-react';
import type { ClientWithStats } from '@/features/clients/types';

export function ClientsHeader({ clients, total, onCreate }: {
  clients: ClientWithStats[];
  total: number;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Sparkles className="size-3.5 text-[var(--gold-deep)]" />
          <span>Gestion des clients &bull; {total} au total</span>
        </div>
        <h1 className="font-display text-5xl lg:text-6xl text-gradient-charcoal leading-[1.05]">
          Clients
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          G&eacute;rez, suivez et d&eacute;veloppez votre portefeuille clients.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          className="h-10 rounded-lg border-border bg-background/60 backdrop-blur"
          onClick={() => {
            const csv = clients.map(c =>
              `${c.name},${c.company || ''},${c.email || ''},${c.phone || ''},${c.city || ''},${Number(c.totalSpent)}`
            ).join('\n');
            const blob = new Blob(['Nom,Compagnie,Email,Téléphone,Ville,Total dépensé\n' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clients.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <FileText className="size-4" /> Exporter
        </Button>
        <EyeToggle />
        <Button onClick={onCreate} className="h-10 rounded-lg bg-gradient-charcoal text-white shadow-lift hover:opacity-95 gap-2 px-4">
          <Plus className="size-4" /> Nouveau client
        </Button>
      </div>
    </div>
  );
}
