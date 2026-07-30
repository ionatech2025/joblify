import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Keyboard key chip — the hint legend along the bottom of the command palette
 * ("↑↓ navigate · ↵ open · esc close") and inline shortcut hints elsewhere.
 */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'border-border bg-surface-sunken text-fg-muted inline-flex h-5 min-w-5 items-center justify-center rounded-[0.3rem] border px-1.5 font-sans text-[0.6875rem] font-medium',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/** One `keys → meaning` pair in the palette's footer legend. */
export function KbdHint({ keys, children }: { keys: string[]; children: ReactNode }) {
  return (
    <span className="text-fg-subtle inline-flex items-center gap-1 text-xs">
      {keys.map((k) => (
        <Kbd key={k}>{k}</Kbd>
      ))}
      {children}
    </span>
  );
}
