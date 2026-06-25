export function calcGrowth(data: number[]): number {
  if (data.length < 2) return 0;
  const prev = data[data.length - 2];
  const curr = data[data.length - 1];
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}
