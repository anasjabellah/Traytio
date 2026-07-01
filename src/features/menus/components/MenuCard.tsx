'use client';

import { motion } from 'framer-motion';
import { Eye, Pencil, Trash2, Utensils, Users } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_BADGE_COLORS } from '@/features/menus/constants';
import type { Menu } from '@/features/menus/types';

const dh = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

interface MenuCardProps {
  menu: Menu;
  index: number;
  onView: (menu: Menu) => void;
  onEdit: (menu: Menu) => void;
  onDelete: (menu: Menu) => void;
}

export function MenuCard({ menu, index, onView, onEdit, onDelete }: MenuCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      className="group rounded-2xl border border-border/60 bg-card shadow-soft hover:shadow-lift transition-all"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-semibold text-foreground truncate">{menu.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${CATEGORY_BADGE_COLORS[menu.category] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {CATEGORY_LABELS[menu.category] || menu.category}
              </span>
              {!menu.isActive && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-600 font-medium">
                  Inactif
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold tabular-nums text-[var(--gold-deep)] tracking-tight">{dh(Number(menu.pricePerPerson))}</div>
            <div className="text-[10px] text-muted-foreground/60 mt-0.5">/ personne</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-foreground/[0.03] border border-border/40 p-2.5">
            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Users className="size-3" strokeWidth={1.5} />
              Min
            </div>
            <div className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">{menu.minPersons}</div>
          </div>
          <div className="rounded-lg bg-foreground/[0.03] border border-border/40 p-2.5">
            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Users className="size-3" strokeWidth={1.5} />
              Max
            </div>
            <div className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">{menu.maxPersons ?? '—'}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Utensils className="size-3" strokeWidth={1.5} />
            {menu.menuItems?.length ?? 0} article{(menu.menuItems?.length ?? 0) > 1 ? 's' : ''}
          </span>
          <span>Créé le {new Date(menu.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>

        {menu.isActive && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Actif
            </span>
          </div>
        )}
      </div>

      <div className="px-5 pb-5 flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onView(menu); }}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-2 text-xs font-medium text-muted-foreground/60 transition-all hover:shadow-sm hover:text-[var(--gold-deep)] hover:border-[var(--gold-soft)]/50"
        >
          <Eye className="size-3.5" strokeWidth={1.8} />
          Voir
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(menu); }}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-2 text-xs font-medium text-muted-foreground/60 transition-all hover:shadow-sm hover:text-foreground hover:border-foreground/20"
        >
          <Pencil className="size-3.5" strokeWidth={1.8} />
          Modifier
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(menu); }}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-2 text-xs font-medium text-muted-foreground/60 transition-all hover:shadow-sm hover:text-red-600 hover:border-red-200"
        >
          <Trash2 className="size-3.5" strokeWidth={1.8} />
          Supprimer
        </button>
      </div>
    </motion.div>
  );
}
