const TZ = 'Africa/Casablanca';

export function tzDateKey(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

export function tzMonthKey(d: Date): string {
  return tzDateKey(d).slice(0, 7);
}
