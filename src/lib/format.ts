export function formatShortDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatLongDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
