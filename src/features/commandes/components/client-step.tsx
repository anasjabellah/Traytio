"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X, Crown } from "lucide-react";

type Client = any;

export function ClientStep({ client, setClient, onCreate, clients, isLoading }: { client: Client; setClient: (c: Client) => void; onCreate: () => void; clients: any[]; isLoading: boolean }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-soft px-4 py-3.5">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <span className="text-sm text-muted-foreground">Chargement des clients...</span>
      </div>
    );
  }

  const filtered = clients.filter(
    (c) => c.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.phone?.includes(query) ||
      c.email?.toLowerCase().includes(query.toLowerCase())
  );
  const showResults = focused && !client && (query.length > 0 || true);

  if (client) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-2xl border border-gold/40 bg-gradient-to-br from-gold-soft/40 to-transparent p-5"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-charcoal text-primary-foreground flex items-center justify-center font-display text-xl">
            {client.name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="font-medium">{client.name}</div>
              {client.vip && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-gold text-gold-foreground px-2 py-0.5 text-[10px] font-medium">
                  <Crown className="h-2.5 w-2.5" /> VIP
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{client.email} · {client.phone}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{client._count?.events || 0} événements à ce jour</div>
          </div>
        </div>
        <button onClick={() => setClient(null)} className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className={`flex items-center gap-3 rounded-2xl border bg-surface-soft px-4 transition-all ${focused ? "border-gold ring-gold" : "border-border"}`}>
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Rechercher un client par nom, téléphone, email…"
            className="flex-1 bg-transparent py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-primary-foreground px-3 py-1.5 text-xs font-medium hover:shadow-gold transition-all"
          >
            <Plus className="h-3 w-3" /> Nouveau client
          </button>
        </div>

        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute z-10 left-0 right-0 mt-2 rounded-2xl border border-border bg-card shadow-lift overflow-hidden"
            >
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground bg-surface-soft border-b border-border">
                {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
              </div>
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onMouseDown={() => setClient(c)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-soft transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                      {c.name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {c.name}
                        {c.vip && <Crown className="h-3 w-3 text-gold-deep" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{c.phone}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{c._count?.events || 0} évts</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Aucun client trouvé · <button onMouseDown={onCreate} className="text-foreground underline">Créer "{query}"</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
