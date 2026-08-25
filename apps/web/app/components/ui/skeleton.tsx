import { cn } from '@/lib/cn';

/**
 * Loading placeholder. Sizes are deliberately matched to the real content they
 * stand in for so the swap costs no layout shift — that CLS-neutrality is the
 * whole point of the house shapes below, and the reason `loading.tsx` files
 * should compose these rather than hand-rolling pulse divs.
 *
 * Under `prefers-reduced-motion` the pulse is neutralised globally by the base
 * layer in globals.css; the block still reads as a placeholder.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('bg-surface-sunken animate-pulse rounded-full', className)} />
  );
}

/** Page/section title placeholder. */
export function SkeletonTitle({ className }: { className?: string }) {
  return <Skeleton className={cn('h-8 w-64', className)} />;
}

/** Body copy placeholder — `lines` stacked bars with a short last line. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/**
 * Card placeholder matching the rounded-card + hairline shape of a real Card.
 * Accepts children so a row can reserve its own internal bars (a label plus
 * action pills, say) instead of being one undifferentiated block.
 */
export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'border-border bg-surface/70 rounded-card h-24 border',
        // A block with inner bars would double-pulse; let the children animate.
        children ? '' : 'animate-pulse',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A stack of `count` card placeholders — the standard list-page fallback. */
export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
