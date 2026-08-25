import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Root of every back-office page. The `o-console` class is what switches the
 * whole token layer from the editorial register to the Odoo-enterprise one
 * (see the `.o-console` block in globals.css) — so nothing below this needs to
 * know which register it is in, and the shared primitives (Card, Badge, Input,
 * Button) re-skin on their own.
 *
 * `bg-canvas` is opaque on purpose: the root layout paints a fixed ambient
 * gradient behind every route, and a translucent console would let an aurora
 * wash bleed through a data table.
 *
 * The editorial footer is hidden under this class by a `:has()` rule in
 * globals.css rather than a route check — the root layout renders the footer
 * outside any Suspense boundary, where reading the pathname would collapse
 * every route's PPR shell.
 */
export function ConsoleShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('o-console text-fg bg-canvas min-h-screen', className)}>{children}</div>
  );
}

/**
 * The width every console surface aligns to. Wider than the editorial
 * `Container` (max-w-6xl): a list view with six columns and an aggregate row
 * needs the room, and Odoo's own views run edge-to-edge.
 */
export function ConsoleWidth({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-[92rem] px-3 sm:px-4', className)}>{children}</div>
  );
}
