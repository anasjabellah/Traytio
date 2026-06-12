'use client';

import { Users, Search, Plus, X } from 'lucide-react';

export function NoClientsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-16">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm mx-auto">
        <div className="size-20 rounded-[1.25rem] border-2 border-dashed border-border/60 bg-background flex items-center justify-center">
          <Users className="size-9 text-muted-foreground/30" strokeWidth={1.2} />
        </div>
        <div>
          <h3 className="font-display text-2xl text-foreground">Aucun client</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Votre portefeuille clients est vide. <br />
            Commencez par ajouter votre premier client.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 bg-foreground hover:opacity-90 text-background rounded-xl px-6 py-3 text-sm font-medium transition-all shadow-sm"
        >
          <Plus className="size-4" strokeWidth={1.8} />
          Ajouter un client
        </button>
      </div>
    </div>
  );
}

export function NoResultsEmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-16">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm mx-auto">
        <div className="size-20 rounded-[1.25rem] border-2 border-dashed border-border/60 bg-background flex items-center justify-center">
          <Search className="size-9 text-muted-foreground/30" strokeWidth={1.2} />
        </div>
        <div>
          <h3 className="font-display text-2xl text-foreground">Aucun r&eacute;sultat</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Aucun client ne correspond &agrave; votre recherche <br />
            &laquo; <span className="font-medium text-foreground">{query}</span> &raquo;
          </p>
        </div>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 bg-foreground hover:opacity-90 text-background rounded-xl px-6 py-3 text-sm font-medium transition-all shadow-sm"
        >
          <X className="size-4" strokeWidth={1.8} />
          Effacer la recherche
        </button>
      </div>
    </div>
  );
}
