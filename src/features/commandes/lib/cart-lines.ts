import type { SelectedItem } from "../data/mock-data";

// ---------------------------------------------------------------------------
// Price-versioned cart lines.
//
// A cart line is identified by product/configuration AND the unit price that
// was active when its quantity was added — never by product id alone.
// Map keys are line keys (`<id>::<unitPrice>`); entries WITHOUT a carried
// unitPrice (pack applications, note-first stubs) keep the legacy bare `id`
// key and resolve against the live catalog until a priced interaction
// snapshots them. This guarantees:
//   - same product + same price  → quantities merge into one line;
//   - same product + new price   → a NEW independent line is created;
//   - existing quantities are never repriced by catalog changes;
//   - per-line totals always use the line's own stored unit price.
// All helpers are pure (state in → new state out) and insertion-ordered.
// ---------------------------------------------------------------------------

export function lineKeyFor(id: string, unitPrice: number | undefined): string {
  return Number.isFinite(unitPrice) ? `${id}::${String(unitPrice)}` : id;
}

export type LineEntry = { key: string; line: SelectedItem };

/** All lines of one product, oldest first (insertion order). */
export function linesOf(
  selected: Record<string, SelectedItem>,
  id: string,
): LineEntry[] {
  return Object.entries(selected)
    .filter(([, s]) => s.id === id)
    .map(([key, line]) => ({ key, line }));
}

/** Aggregate quantity across every price version of a product. */
export function productQty(selected: Record<string, SelectedItem>, id: string): number {
  return linesOf(selected, id).reduce((acc, { line }) => acc + (line.qty || 0), 0);
}

/** Note shown for a product: newest non-empty note, else newest line's note. */
export function productNote(
  selected: Record<string, SelectedItem>,
  id: string,
): string | undefined {
  const lines = linesOf(selected, id);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].line.note) return lines[i].line.note;
  }
  return lines.length > 0 ? lines[lines.length - 1].line.note : undefined;
}

/** True when a product holds 2+ lines with different stored unit prices. */
export function hasMultiplePrices(selected: Record<string, SelectedItem>, id: string): boolean {
  const prices = new Set<number>();
  for (const { line } of linesOf(selected, id)) {
    if ((line.qty || 0) > 0 && line.unitPrice !== undefined) prices.add(line.unitPrice);
  }
  return prices.size > 1;
}

/**
 * Display price for a product's catalog card: the single stored unit price
 * when every active line shares it, otherwise the live catalog price (used
 * only as a fallback — callers show the neutral multi-price label then).
 * Read-only; pricing and persistence semantics are untouched.
 */
export function displayPriceFor(
  selected: Record<string, SelectedItem>,
  id: string,
  livePrice: number,
): { price: number; multi: boolean } {
  const effective = new Set<number>();
  for (const { line } of linesOf(selected, id)) {
    if ((line.qty || 0) > 0) effective.add(line.unitPrice ?? livePrice);
  }
  if (effective.size === 1) {
    const [only] = [...effective];
    return { price: only, multi: false };
  }
  return { price: livePrice, multi: effective.size > 1 };
}

/** True total of a product: each line valued at its own stored price. */
export function productTotal(
  selected: Record<string, SelectedItem>,
  id: string,
  livePrice?: number,
): number {
  return linesOf(selected, id).reduce(
    (acc, { line }) => acc + (line.qty || 0) * (line.unitPrice ?? livePrice ?? 0),
    0,
  );
}

/**
 * Set the AGGREGATE quantity of a product, preserving per-line prices.
 * Positive delta flows into the current-price line (created on demand —
 * same price merges by key); negative delta spills newest-first. A bare
 * (priceless) stub is folded into the priced line when the price is known.
 * Zero-quantity lines are kept (toggle/deselect + note semantics).
 */
export function setProductQty(
  selected: Record<string, SelectedItem>,
  id: string,
  target: number,
  currentPrice?: number,
): Record<string, SelectedItem> {
  const qty = Math.max(0, target);
  const next: Record<string, SelectedItem> = { ...selected };

  // Fold a priceless stub into the priced line (snapshot on interaction).
  const stubKey = id;
  const stub = next[stubKey];
  if (stub && stub.id === id && stub.unitPrice === undefined && currentPrice !== undefined) {
    const key = lineKeyFor(id, currentPrice);
    const priced = next[key];
    next[key] = {
      id,
      qty: (stub.qty || 0) + (key !== stubKey ? priced?.qty || 0 : 0),
      unitPrice: currentPrice,
      note: priced?.note ?? stub.note ?? '',
      ...(priced?.name !== undefined ? { name: priced.name } : {}),
      ...(priced?.name === undefined && stub.name !== undefined ? { name: stub.name } : {}),
    };
    if (key !== stubKey) delete next[stubKey];
  }

  const lines = linesOf(next, id);
  const total = lines.reduce((acc, { line }) => acc + (line.qty || 0), 0);
  const delta = qty - total;
  if (delta === 0) return next;

  if (delta > 0) {
    const key =
      currentPrice !== undefined
        ? lineKeyFor(id, currentPrice)
        : (lines[lines.length - 1]?.key ?? id);
    const entry = next[key];
    next[key] = {
      id,
      qty: (entry?.qty || 0) + delta,
      note: entry?.note ?? '',
      ...(entry?.unitPrice !== undefined ? { unitPrice: entry.unitPrice } : {}),
      ...(currentPrice !== undefined ? { unitPrice: currentPrice } : {}),
      ...(entry?.name !== undefined ? { name: entry.name } : {}),
    };
    return next;
  }

  let rest = -delta;
  for (let i = lines.length - 1; i >= 0 && rest > 0; i--) {
    const { key } = lines[i];
    const cur = next[key];
    if (!cur) continue;
    const take = Math.min(cur.qty || 0, rest);
    next[key] = { ...cur, qty: (cur.qty || 0) - take };
    rest -= take;
  }
  return next;
}

/** Deselect a product: zero every price version, keep entries (notes/prices). */
export function clearProduct(
  selected: Record<string, SelectedItem>,
  id: string,
): Record<string, SelectedItem> {
  const next = { ...selected };
  for (const { key, line } of linesOf(next, id)) {
    if ((line.qty || 0) !== 0) next[key] = { ...line, qty: 0 };
  }
  return next;
}

/**
 * Annotate a product: newest line with quantity wins, else newest line,
 * else a priceless stub (legacy note-first shape).
 */
export function setProductNote(
  selected: Record<string, SelectedItem>,
  id: string,
  note: string,
): Record<string, SelectedItem> {
  const next = { ...selected };
  const lines = linesOf(next, id);
  const withQty = lines.filter(({ line }) => (line.qty || 0) > 0);
  const target = withQty[withQty.length - 1] ?? lines[lines.length - 1];
  if (!target) {
    next[id] = { id, qty: 0, note };
    return next;
  }
  next[target.key] = { ...target.line, note };
  return next;
}

/**
 * Build initial selection from persisted rows (edit hydration). Rows sharing
 * product AND price merge; different prices stay independent lines.
 */
export function hydrateLines(
  rows: Array<{ id: string; qty: number; note?: string; unitPrice?: number; name?: string }>,
): Record<string, SelectedItem> {
  const out: Record<string, SelectedItem> = {};
  for (const row of rows) {
    const key = lineKeyFor(row.id, row.unitPrice);
    const prev = out[key];
    if (prev) {
      out[key] = { ...prev, qty: (prev.qty || 0) + row.qty };
    } else {
      out[key] = {
        id: row.id,
        qty: row.qty,
        note: row.note ?? '',
        ...(row.unitPrice !== undefined ? { unitPrice: row.unitPrice } : {}),
        ...(row.name !== undefined ? { name: row.name } : {}),
      };
    }
  }
  return out;
}
