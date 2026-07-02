"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Loader2, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { searchGlobal, type SearchGroup, type SearchResultItem } from "@/features/search/actions/search-global"

const RECENT_KEY = "tur:global-search:recent"
const MAX_RECENT = 8
const DEBOUNCE_MS = 250

function getRecent(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function setRecent(query: string) {
  try {
    const prev = getRecent().filter((r) => r !== query)
    prev.unshift(query)
    localStorage.setItem(RECENT_KEY, JSON.stringify(prev.slice(0, MAX_RECENT)))
  } catch { /* noop */ }
}

const GROUPS_CONFIG: { key: string; label: string }[] = [
  { key: "clients", label: "Clients" },
  { key: "commandes", label: "Commandes" },
  { key: "invoices", label: "Factures" },
  { key: "events", label: "Événements" },
  { key: "payments", label: "Paiements" },
  { key: "menus", label: "Menus" },
  { key: "menuItems", label: "Menu Items" },
  { key: "members", label: "Membres" },
]

function highlightText(text: string, query: string) {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const parts = text.split(new RegExp(`(${escaped})`, "gi"))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-[var(--gold-soft)]/50 text-foreground rounded-sm px-0.5">{part}</mark>
    ) : (
      part
    ),
  )
}

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Record<string, SearchResultItem[]> | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [mounted, setMounted] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      if (raw) setRecentSearches(JSON.parse(raw) as string[])
    } catch { /* noop */ }
  }, [])

  const allItems = useMemo(() => {
    if (!results) return []
    const items: { groupIndex: number; item: SearchResultItem }[] = []
    GROUPS_CONFIG.forEach((g, gi) => {
      const groupItems = results[g.key]
      if (groupItems && groupItems.length > 0) {
        groupItems.forEach((item) => items.push({ groupIndex: gi, item }))
      }
    })
    return items
  }, [results])

  const flatItems = useMemo(() => allItems.map((e) => e.item), [allItems])

  useEffect(() => {
    if (open) {
      setQuery("")
      setResults(null)
      setLoading(false)
      setSelectedIndex(-1)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await searchGlobal(q)
      setResults(data as unknown as Record<string, SearchResultItem[]>)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value)
      setSelectedIndex(-1)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => doSearch(value), DEBOUNCE_MS)
    },
    [doSearch],
  )

  const navigate = useCallback(
    (item: SearchResultItem) => {
      setRecent(query)
      onClose()
      router.push(item.href)
    },
    [query, onClose, router],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1))
      } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < flatItems.length) {
        e.preventDefault()
        navigate(flatItems[selectedIndex])
      }
    },
    [flatItems, selectedIndex, navigate],
  )

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null
      el?.scrollIntoView({ block: "nearest" })
    }
  }, [selectedIndex])

  const hasResults = results && Object.values(results).some((arr) => arr.length > 0)
  const isEmpty = results && !hasResults

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center pt-[12vh] sm:pt-[10vh]",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={cn(
          "relative w-full max-w-[600px] mx-4 rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden transition-all duration-200",
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-4",
        )}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border/10">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />
          ) : (
            <Search className="size-4 text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher clients, commandes, factures..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-flex text-[10px] font-sans px-1.5 py-0.5 rounded border bg-muted/60 text-muted-foreground/60 shrink-0">ESC</kbd>
          <button
            onClick={onClose}
            className="size-8 rounded-lg hover:bg-muted/30 flex items-center justify-center shrink-0"
            aria-label="Fermer"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
          {mounted && !query.trim() && recentSearches.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/40">
                Recherches récentes
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term)
                    doSearch(term)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground/70 hover:bg-foreground/[0.03] transition-colors truncate"
                >
                  {term}
                </button>
              ))}
            </div>
          )}

          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="size-8 text-muted-foreground/20 mb-3" strokeWidth={1.2} />
              <p className="text-sm text-muted-foreground/60 font-medium">No results found</p>
              <p className="text-xs text-muted-foreground/40 mt-1">Try a different search term</p>
            </div>
          )}

          {hasResults &&
            GROUPS_CONFIG.map((group) => {
              const items = results[group.key]
              if (!items || items.length === 0) return null
              return (
                <div key={group.key}>
                  <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/40">
                    {group.label}
                  </div>
                  {items.map((item) => {
                    const idx = flatItems.indexOf(item)
                    return (
                      <button
                        key={item.id}
                        data-index={idx}
                        onClick={() => navigate(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors",
                          selectedIndex === idx ? "bg-foreground/[0.04]" : "hover:bg-foreground/[0.03]",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">
                              {highlightText(item.label, query)}
                            </span>
                            {item.badge && (
                              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/[0.06] text-muted-foreground font-medium uppercase tracking-wider">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <div className="text-xs text-muted-foreground/60 truncate mt-0.5">
                              {highlightText(item.subtitle, query)}
                            </div>
                          )}
                        </div>
                        <ArrowUpRight className="size-3 text-muted-foreground/30 shrink-0" strokeWidth={2} />
                      </button>
                    )
                  })}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
