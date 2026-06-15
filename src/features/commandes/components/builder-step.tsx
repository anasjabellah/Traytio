"use client"

import { useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ChefHat, Wine, CakeSlice, Flower2, Music4, Sparkles, ChevronDown, Package } from "lucide-react";
import { type SelectedItem } from "@/features/commandes/data/mock-data";
import type { MenuItemDisplay } from "@/features/commandes/types";
import { ItemCard } from "./item-card";

const CATEGORY_LABEL: Record<string, string> = {
  Food: "Plats", Drinks: "Boissons", Desserts: "Desserts",
  Decoration: "Décoration", Services: "Services",
  Divertissement: "Divertissement", Extras: "Extras",
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  Food: ChefHat, Drinks: Wine, Desserts: CakeSlice,
  Decoration: Flower2, Divertissement: Music4, Extras: Sparkles,
};

const CATEGORY_ORDER: Record<string, number> = {
  Food: 0, Drinks: 1, Desserts: 2, Decoration: 3, Services: 4, Divertissement: 5, Extras: 6,
};

const IconFallback = () => <span className="text-base">\uD83D\uDCE6</span>;

export function BuilderStep({
  menuItems, selected, openCats, setOpenCats, setQty, setNote, toggleItem,
}: {
  menuItems: MenuItemDisplay[];
  selected: Record<string, SelectedItem>;
  openCats: Record<string, boolean>;
  setOpenCats: (v: Record<string, boolean>) => void;
  setQty: (id: string, q: number) => void;
  setNote: (id: string, n: string) => void;
  toggleItem: (id: string) => void;
}) {
  const categories = useMemo(() => {
    const ids = [...new Set(menuItems.map((m) => m.category))];
    ids.sort((a, b) => (CATEGORY_ORDER[a] ?? 99) - (CATEGORY_ORDER[b] ?? 99));
    return ids.map((id) => ({
      id,
      label: CATEGORY_LABEL[id] ?? id,
      Icon: CATEGORY_ICON[id] ?? IconFallback,
    }));
  }, [menuItems]);

  return (
    <div className="space-y-3">
      <LayoutGroup>
        {categories.map((cat) => {
          const items = menuItems.filter((m) => m.category === cat.id);
          const count = items.filter((i) => (selected[i.id]?.qty || 0) > 0).length;
          const isOpen = openCats[cat.id] ?? true;
          return (
            <motion.div layout key={cat.id} className="rounded-2xl border border-border bg-surface-soft overflow-hidden">
              <button
                onClick={() => setOpenCats({ ...openCats, [cat.id]: !isOpen })}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-foreground/70"><cat.Icon className="h-5 w-5" /></span>
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
                      {items.length === 0 ? (
                        <div className="col-span-2 py-6 flex flex-col items-center gap-2 text-muted-foreground">
                          <Package className="size-6 opacity-40" />
                          <p className="text-xs">Aucun produit dans cette catégorie</p>
                        </div>
                      ) : (
                        items.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            state={selected[item.id]}
                            onToggle={() => toggleItem(item.id)}
                            onQty={(n) => setQty(item.id, n)}
                            onNote={(n) => setNote(item.id, n)}
                          />
                        ))
                      )}
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
