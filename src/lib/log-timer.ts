export function startTimer(label: string): string | null {
  if (process.env.NODE_ENV !== 'development') return null;
  const id = crypto.randomUUID();
  const fullLabel = `${label}:${id}`;
  console.time(fullLabel);
  return fullLabel;
}

export function endTimer(timer: string | null): void {
  if (timer) console.timeEnd(timer);
}
