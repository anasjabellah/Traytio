'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  loading?: boolean;
};

function getPageWindow(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 4) pages.push('ellipsis');
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 3) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  itemLabel = 'élément',
  loading = false,
}: PaginationProps) {
  if (totalPages <= 1 && !onLimitChange) return null;

  const pageWindow = getPageWindow(page, totalPages);
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
          {startItem}–{endItem} sur {total} {itemLabel}{total > 1 ? 's' : ''}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center flex-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || loading}
                className="h-8 sm:h-7 px-2.5 sm:px-2.5 rounded-lg sm:rounded-md border border-border flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-3.5" />
                <span className="hidden sm:inline">Précédent</span>
              </button>

              {pageWindow.map((p, i) =>
                p === 'ellipsis' ? (
                  <span key={`e-${i}`} className="w-7 sm:w-6 h-8 sm:h-7 flex items-center justify-center text-xs text-muted-foreground/30 select-none">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    disabled={loading}
                    className={`min-w-7 sm:min-w-[28px] h-7 sm:h-7 rounded-md sm:rounded-md text-xs font-medium transition-all ${
                      p === page
                        ? 'bg-foreground text-background shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    } disabled:cursor-not-allowed`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || loading}
                className="h-8 sm:h-7 px-2.5 sm:px-2.5 rounded-lg sm:rounded-md border border-border flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Suivant</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {onLimitChange && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground shrink-0">
            <span className="hidden sm:inline">Lignes par page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="text-xs sm:text-sm bg-transparent border border-border rounded-lg px-3 py-2 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--gold-deep)]/30"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
