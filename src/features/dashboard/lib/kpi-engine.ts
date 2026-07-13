export type KpiResult = {
  delta: number;
  trend: 'up' | 'down';
  spark: number[];
};

/**
 * Calculate percentage change between two values.
 *
 *   previous=0, current=0   →  0
 *   previous=0, current>0   →  100
 *   previous>0, current=0   → -100
 *   otherwise               →  round((c - p) / p * 100)
 */
export function computePercentage(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return current > 0 ? 100 : -100;
  if (current === 0) return -100;
  return Math.round(((current - previous) / previous) * 100);
}

export function determineTrend(delta: number): 'up' | 'down' {
  if (delta < 0) return 'down';
  return 'up';
}

/** Flat neutral sparkline when no historical data exists. */
export function emptySparkline(months: number = 8): number[] {
  return new Array(months).fill(1);
}

/** Build month-key list for the last N months ending at (now). */
export function buildMonthKeys(months: number = 8, now?: Date): string[] {
  const ref = now ?? new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const m = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    keys.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

/**
 * Bucket rows by creation month into a per-month array aligned to `monthKeys`.
 * When extractValue is provided the values are summed; otherwise each row counts as 1.
 */
export function buildMonthlySparkline<T extends { createdAt: Date }>(
  rows: T[],
  monthKeys: string[],
  extractValue?: (row: T) => number,
): number[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const d = new Date(row.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const val = extractValue ? extractValue(row) : 1;
    map.set(key, (map.get(key) ?? 0) + val);
  }
  return monthKeys.map((key) => {
    const v = map.get(key);
    return v !== undefined ? Math.round(v) : 0;
  });
}

/**
 * Align a pre-bucketed month→value map to the key order.
 */
export function buildMonthlySparklineFromMap(
  monthlyMap: Map<string, number>,
  monthKeys: string[],
): number[] {
  return monthKeys.map((key) => Math.round(monthlyMap.get(key) ?? 0));
}

/**
 * Derive delta, trend, and sparkline from a monthly sparkline array.
 *
 * The delta compares the last two entries.  An empty or single-element array
 * produces delta 0 / neutral / all-ones spark.
 */
export function computeKpi(spark: number[]): KpiResult {
  if (spark.length < 2) {
    return { delta: 0, trend: 'up', spark: emptySparkline() };
  }
  const current = spark[spark.length - 1];
  const previous = spark[spark.length - 2];
  const delta = computePercentage(current, previous);
  return { delta, trend: determineTrend(delta), spark };
}
