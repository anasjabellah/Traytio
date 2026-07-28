export function scrollToFirstError(
  errors: Record<string, unknown>,
  containerSelector?: string,
) {
  const keys = Object.keys(errors);
  if (keys.length === 0) return;

  const firstKey = keys[0];
  const el = document.querySelector(`[data-field="${firstKey}"]`);
  if (!el) return;

  const container = containerSelector
    ? el.closest(containerSelector)
    : el.closest('[data-scroll-container]');

  const isVisible = (): boolean => {
    if (!container) return true;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    return eRect.top >= cRect.top + 8 && eRect.bottom <= cRect.bottom - 8;
  };

  if (isVisible()) {
    const input = el.querySelector<HTMLElement>('input, button, textarea, select');
    if (input && document.activeElement !== input) {
      input.focus({ preventScroll: true });
    }
    return;
  }

  const currentFocus = document.activeElement;

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  requestAnimationFrame(() => {
    if (document.activeElement !== currentFocus) return;
    const input = el.querySelector<HTMLElement>('input, button, textarea, select');
    if (input) {
      input.focus({ preventScroll: true });
    }
  });
}
