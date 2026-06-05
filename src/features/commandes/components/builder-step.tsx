"use client"

import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { MENU, type Cat, type SelectedItem } from "@/features/commandes/data/mock-data";
import { ItemCard } from "./item-card";

const CATEGORIES: { id: Cat; label: string; icon: string }[] = [
  { id: "Food", label: "Plats", icon: "\uD83C\uDF7D\uFE0F" },
  { id: "Drinks", label: "Boissons", icon: "\uD83E\uDD42" },
  { id: "Desserts", label: "Desserts", icon: "\uD83C\uDF70" },
  { id: "Decoration", label: "Décoration", icon: "\uD83D\uDC90" },
  { id: "Extras", label: "Extras", icon: "\u2728" },
];

export function BuilderStep({
  selected, openCats, setOpenCats, setQty, setNote, toggleItem,
}: {
  selected: Record<string, SelectedItem>;
  openCats: Record<Cat, boolean>;
  setOpenCats: (v: Record<Cat, boolean>) => void;
  setQty: (id: string, q: number) => void;
  setNote: (id: string, n: string) => void;
  toggleItem: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <LayoutGroup>
        {CATEGORIES.map((cat) => {
          const items = MENU.filter((m) => m.category === cat.id);
          const count = items.filter((i) => (selected[i.id]?.qty || 0) > 0).length;
          const isOpen = openCats[cat.id];
          return (
            <motion.div layout key={cat.id} className="rounded-2xl border border-border bg-surface-soft overflow-hidden">
              <button
                onClick={() => setOpenCats({ ...openCats, [cat.id]: !isOpen })}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="text-left">
                    <div className="font-display text-xl">{cat.label}</div>
                    <div className="text-[11px] text-muted-foreground">{items.length} produits disponibles</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {count > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-foreground text-primary-foreground px-2.5 py-0.5 text-[10px] font-medium">
                      {count} sélectionné{count > 1 ? "s" : ""}
                    </span>
                  )}
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </motion.span>
                </div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="p-4 grid sm:grid-cols-2 gap-3 bg-card border-t border-border">
                      {items.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          state={selected[item.id]}
                          onToggle={() => toggleItem(item.id)}
                          onQty={(n) => setQty(item.id, n)}
                          onNote={(n) => setNote(item.id, n)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
