import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'default' | 'glass' | 'dark' | 'sunken';

// Elevated rounded surface. `glass` floats over imagery/ambient washes;
// `dark` is the ink ticket-card register (inverted text, use sparingly);
// `sunken` is a recessed well for kanban columns and table headers.
//
// In dark mode elevation stops coming from the shadow — it comes from
// --surface being lighter than --canvas plus the hairline border.
const tones: Record<Tone, string> = {
  default: 'border-border bg-surface shadow-soft',
  glass: 'glass border shadow-soft',
  dark: 'border-band-fg/10 bg-band text-band-fg shadow-soft',
  sunken: 'border-border bg-surface-sunken',
};

export function Card({
  tone = 'default',
  interactive = false,
  className,
  children,
}: {
  tone?: Tone;
  /** Adds the hover lift used by every card that is itself a link. */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-card border p-4',
        tones[tone],
        interactive && 'hover:shadow-raised transition-shadow',
        className,
      )}
    >
      {children}
    </div>
  );
}

// Optional structure. Every pre-existing call site passes plain children and
// keeps working — these only exist so new surfaces stop re-inventing the same
// header/title/footer spacing.

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex items-start justify-between gap-3', className)}>{children}</div>;
}

export function CardTitle({
  as: As = 'h3',
  className,
  children,
}: {
  as?: 'h2' | 'h3' | 'h4';
  className?: string;
  children: ReactNode;
}) {
  return <As className={cn('text-fg m-0 text-base font-semibold', className)}>{children}</As>;
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('text-fg-muted mt-2 text-sm', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('border-border mt-4 flex items-center gap-3 border-t pt-3', className)}>
      {children}
    </div>
  );
}
