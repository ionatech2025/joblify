import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'brand' | 'neutral' | 'success' | 'warn' | 'danger' | 'info' | 'dark';

// Chip/badge. `brand` is the historical default (most existing call sites);
// `dark` is the inverted price/salary chip from the ticket-card register.
// Every tone is a subtle-bg + readable-fg pair that flips with the theme.
const tones: Record<Tone, string> = {
  brand: 'bg-brand-subtle text-brand-subtle-fg',
  neutral: 'bg-surface-sunken text-fg-muted',
  success: 'bg-success-subtle text-success-subtle-fg',
  warn: 'bg-warn-subtle text-warn-subtle-fg',
  danger: 'bg-danger-subtle text-danger-subtle-fg',
  info: 'bg-info-subtle text-info-subtle-fg',
  dark: 'bg-ink text-ink-fg',
};

export function Badge({
  tone = 'brand',
  corner = false,
  className,
  children,
}: {
  tone?: Tone;
  /**
   * Pins the badge to the top-right of the nearest `relative` ancestor — the
   * discount/status chip overlaying a card in the ticket-card register.
   */
  corner?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        corner && 'absolute top-3 right-3 z-10 shadow-sm',
        className,
      )}
    >
      {children}
    </span>
  );
}
