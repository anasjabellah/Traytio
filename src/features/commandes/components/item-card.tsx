"use client"

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, StickyNote } from "lucide-react";
import { type SelectedItem } from "@/features/commandes/data/mock-data";
import type { MenuItemDisplay } from "@/features/commandes/types";

/**
 * Resolves the renderable image source. A stored imageUrl can be
 * truthy-but-unrenderable (whitespace, stale/deleted asset, unreachable
 * host) — those must fall back to the placeholder instead of producing a
 * broken-image icon. Returns undefined when no usable URL exists.
 */
export function resolveItemImageSrc(imageUrl?: string | null): string | undefined {
  const src = imageUrl?.trim();
  return src ? src : undefined;
}

/** Parses a typed quantity draft. Returns null when the draft commits to nothing (empty/invalid → caller reverts). */
export function parseQtyDraft(draft: string): number | null {
  const raw = draft.trim().replace(/\D/g, "");
  if (raw === "") return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  // Architecture supports 0 as "deselected" (qty > 0 filter + setQty clamp);
  // negatives are invalid and clamp to 0.
  return Math.max(0, n);
}

export function ItemCard({
  item, state, onToggle, onQty, onNote,
}: {
  item: MenuItemDisplay; state?: SelectedItem;
  onToggle: () => void; onQty: (n: number) => void; onNote: (n: string) => void;
}) {
  const qty = state?.qty || 0;
  const active = qty > 0;
  const [showNote, setShowNote] = useState(false);
  const lineTotal = item.price * qty;

  // Image fallback: once the URL fails to load, stick to the placeholder
  // (reset when the item or its URL changes).
  const imgSrc = resolveItemImageSrc(item.imageUrl);
  const [imgError, setImgError] = useState(false);
  useEffect(() => setImgError(false), [item.id, item.imageUrl]);

  // Editable quantity draft: mirrors qty, lets the user type freely
  // (including a transient empty field), commits on blur/Enter.
  const [qtyDraft, setQtyDraft] = useState(String(qty));
  useEffect(() => setQtyDraft(String(qty)), [qty]);
  const commitQtyDraft = () => {
    const n = parseQtyDraft(qtyDraft);
    if (n === null) {
      setQtyDraft(String(qty));
      return;
    }
    if (n !== qty) onQty(n);
    else setQtyDraft(String(qty));
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={`relative rounded-2xl border p-4 transition-all ${
        active
          ? "border-gold bg-gradient-to-br from-gold-soft/40 to-transparent shadow-soft"
          : "border-border bg-card hover:border-foreground/20 hover:shadow-soft"
      }`}
    >
      {item.tag && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-gradient-gold text-gold-foreground px-2 py-0.5 text-[10px] font-medium">
          {item.tag}
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 rounded-xl bg-surface-soft border border-border flex items-center justify-center text-3xl overflow-hidden">
          {imgSrc && !imgError ? (
            <img
              src={imgSrc}
              alt={item.name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            item.emoji ?? "\u2022"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{item.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</div>
          <div className="text-xs text-muted-foreground mt-1.5 tabular-nums">{item.price} MAD · unité</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key="qty"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card p-0.5"
            >
              <button onClick={() => onQty(qty - 1)} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center" aria-label="Diminuer la quantité">
                <Minus className="h-3 w-3" />
              </button>
              <input
                value={qtyDraft}
                inputMode="numeric"
                aria-label="Quantité"
                onChange={(e) => setQtyDraft(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                onBlur={commitQtyDraft}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                className="text-xs font-medium w-10 text-center tabular-nums bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button onClick={() => onQty(qty + 1)} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center" aria-label="Augmenter la quantité">
                <Plus className="h-3 w-3" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="add"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onToggle}
              className="inline-flex items-center gap-1 rounded-full bg-foreground text-primary-foreground px-3 py-1.5 text-xs"
            >
              <Plus className="h-3 w-3" /> Ajouter
            </motion.button>
          )}
        </AnimatePresence>
        {active && (
          <motion.div key={lineTotal} initial={{ y: -3, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-lg tabular-nums">
            {lineTotal.toLocaleString("fr-MA")} MAD
          </motion.div>
        )}
      </div>

      {active && (
        <motion.div layout className="mt-3 pt-3 border-t border-border/60">
          <button
            onClick={() => setShowNote(!showNote)}
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <StickyNote className="h-3 w-3" /> {state?.note ? "Modifier la note" : "Ajouter une note spéciale"}
          </button>
          <AnimatePresence>
            {showNote && (
              <motion.input
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                value={state?.note || ""}
                onChange={(e) => onNote(e.target.value)}
                placeholder="Sans amandes, dressage VIP…"
                className="mt-2 w-full rounded-xl border border-border bg-surface-soft px-3 py-2 text-xs focus:outline-none focus:border-gold"
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
