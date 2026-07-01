'use client';

import { motion } from 'framer-motion';
import { Eye, Pencil, Copy, Archive, Trash2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_LABELS, CATEGORY_BADGE_COLORS } from '@/features/menu-items/constants';
import type { MenuItem } from '@/features/menu-items/types';

const dh = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

const ITEM_EMOJI: Record<string, string> = {
  FOOD: '\u{1F372}', DRINKS: '\u{1F379}', DESSERTS: '\u{1F36C}',
  DECORATION: '\u{1F490}', STAFF: '\u{1F3A9}',
  ENTERTAINMENT: '\u{1F3A7}', EXTRAS: '\u{1F386}',
};

const CAT_ACCENT: Record<string, string> = {
  FOOD: 'from-orange-50 to-amber-50',
  DRINKS: 'from-blue-50 to-sky-50',
  DESSERTS: 'from-pink-50 to-rose-50',
  DECORATION: 'from-purple-50 to-violet-50',
  STAFF: 'from-green-50 to-emerald-50',
  ENTERTAINMENT: 'from-red-50 to-rose-50',
  EXTRAS: 'from-amber-50 to-yellow-50',
};

interface MenuItemCardProps {
  item: MenuItem;
  index: number;
  onView: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onDuplicate: (item: MenuItem) => void;
  onArchive: (item: MenuItem) => void;
}

export function MenuItemCard({ item, index, onView, onEdit, onDelete, onDuplicate, onArchive }: MenuItemCardProps) {
  const emoji = ITEM_EMOJI[item.category] || '\u{1F4E6}';
  const accent = CAT_ACCENT[item.category] || 'from-gray-50 to-stone-50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      className="group rounded-2xl border border-border/60 bg-card shadow-soft hover:shadow-lift transition-all overflow-hidden"
    >
      <div className={cn('relative aspect-[16/9] bg-gradient-to-br', accent)}>
        <div className="absolute inset-0 grid place-items-center text-5xl drop-shadow-sm">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span>{emoji}</span>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur-md ring-1', CATEGORY_BADGE_COLORS[item.category] || 'bg-background/80 text-foreground')}>
            {CATEGORY_LABELS[item.category] || item.category}
          </span>
        </div>
        {!item.isActive && (
          <div className="absolute left-3 top-3">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur-md bg-zinc-500/70 text-white ring-1 ring-white/10">
              Inactif
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display text-base font-semibold text-foreground truncate">{item.name}</h3>

        {item.notes && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.notes}</p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-foreground/[0.03] border border-border/40 p-2.5">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Unit&eacute;</div>
            <div className="mt-0.5 text-sm font-semibold text-foreground">{item.unit || 'pi&egrave;ce'}</div>
          </div>
          <div className="rounded-lg bg-foreground/[0.03] border border-border/40 p-2.5">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Prix</div>
            <div className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--gold-deep)]">{dh(Number(item.unitPrice))}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="size-3" strokeWidth={1.5} />
            {item.usageCount ?? 0} utilisation{(item.usageCount ?? 0) > 1 ? 's' : ''}
          </span>
          <span>Cr&eacute;&eacute; le {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>

        {item.isActive && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Actif
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 grid grid-cols-3 gap-2">
        <button onClick={() => onView(item)}
          className="flex items-center justify-center gap-1 rounded-full border border-border/60 bg-card px-2 py-2 text-[11px] font-medium text-muted-foreground/60 transition-all hover:shadow-sm hover:text-[var(--gold-deep)] hover:border-[var(--gold-soft)]/50">
          <Eye className="size-3.5" strokeWidth={1.8} /> Voir
        </button>
        <button onClick={() => onEdit(item)}
          className="flex items-center justify-center gap-1 rounded-full border border-border/60 bg-card px-2 py-2 text-[11px] font-medium text-muted-foreground/60 transition-all hover:shadow-sm hover:text-foreground hover:border-foreground/20">
          <Pencil className="size-3.5" strokeWidth={1.8} /> Modifier
        </button>
        <button onClick={() => onDuplicate(item)}
          className="flex items-center justify-center gap-1 rounded-full border border-border/60 bg-card px-2 py-2 text-[11px] font-medium text-muted-foreground/60 transition-all hover:shadow-sm hover:text-foreground hover:border-foreground/20">
          <Copy className="size-3.5" strokeWidth={1.8} /> Dupl.
        </button>
        <button onClick={() => onArchive(item)}
          className="flex items-center justify-center gap-1 rounded-full border border-border/60 bg-card px-2 py-2 text-[11px] font-medium text-muted-foreground/60 transition-all hover:shadow-sm hover:text-amber-600 hover:border-amber-200">
          <Archive className="size-3.5" strokeWidth={1.8} /> Arch.
        </button>
        <button onClick={() => onDelete(item)}
          className="flex items-center justify-center gap-1 rounded-full border border-border/60 bg-card px-2 py-2 text-[11px] font-medium text-muted-foreground/60 transition-all hover:shadow-sm hover:text-red-600 hover:border-red-200 col-span-2">
          <Trash2 className="size-3.5" strokeWidth={1.8} /> Supprimer
        </button>
      </div>
    </motion.div>
  );
}
