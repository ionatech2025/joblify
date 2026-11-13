/**
 * Moves focus off a row action that is about to go away, either with its row
 * or because the row no longer offers it: to the same action in the next row,
 * else the previous row, else `fallback`. Left alone, focus falls to <body>
 * and a keyboard or screen-reader user starts again from the top of the page
 * (WCAG 2.4.3).
 *
 * Peers are the elements that share the control's `data-row-action` value.
 */
export function moveFocusFromRowAction(control: HTMLElement, fallback?: HTMLElement | null): void {
  const peers = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-row-action="${control.dataset.rowAction}"]`),
  );
  const i = peers.indexOf(control);
  (peers[i + 1] ?? peers[i - 1] ?? fallback)?.focus();
}
