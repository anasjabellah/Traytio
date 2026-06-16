'use client';

import { Table2, LayoutGrid, CalendarDays } from 'lucide-react';

export type ViewMode = 'table' | 'grid' | 'calendar';

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const VIEWS: { value: ViewMode; label: string; icon: typeof Table2 }[] = [
  { value: 'table', label: 'Table', icon: Table2 },
  { value: 'grid', label: 'Grille', icon: LayoutGrid },
  { value: 'calendar', label: 'Calendrier', icon: CalendarDays },
];

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center rounded-xl border border-border bg-card shadow-soft p-0.5 gap-0.5">
      {VIEWS.map((v) => {
        const Icon = v.icon;
        const active = value === v.value;
        return (
          <button
            key={v.value}
            onClick={() => onChange(v.value)}
            className={`
              flex items-center justify-center gap-2 px-3.5 py-3 text-xs font-medium rounded-lg transition-all duration-200
              ${active
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/40'
              }
            `}
          >
            <Icon
              className={active ? 'text-background' : 'text-muted-foreground/50'}
              size={18}
              strokeWidth={1.8}
            />
            <span className="hidden sm:inline leading-none">{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}
