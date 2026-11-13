/**
 * When a focused control is removed, focus falls to <body> and a keyboard or
 * screen-reader user starts again from the top of the page (WCAG 2.4.3).
 */
export function moveFocusFromRowAction(control: HTMLElement, fallback?: HTMLElement | null): void {
  const peers = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-row-action="${control.dataset.rowAction}"]`),
  );
  const i = peers.indexOf(control);
  (peers[i + 1] ?? peers[i - 1] ?? fallback)?.focus();
}
