import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The empty state every list surface shares: a glyph, a short headline, one
 * sentence explaining *why* it's empty, and a control that resolves it.
 *
 * Replaces the bare `<p>No X yet.</p>` that ~20 surfaces used to render. The
 * rule of thumb from the reference set: an empty list should always offer the
 * next step, never just report the absence.
 *
 *   <EmptyState
 *     icon={<Bookmark />}
 *     title="No saved jobs yet"
 *     description="Tap “Save job” on any listing to keep it here for later."
 *     action={<Link href="/jobs" className={buttonClasses()}>Browse jobs</Link>}
 *   />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** `sm` for inline panels (a card body, a kanban column). */
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border bg-surface/60 rounded-card flex flex-col items-center border border-dashed text-center',
        size === 'sm' ? 'gap-2 px-4 py-6' : 'gap-3 px-6 py-12',
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden
          className="bg-surface-sunken text-fg-subtle mb-1 grid size-11 place-items-center rounded-full [&>svg]:size-5"
        >
          {icon}
        </span>
      ) : null}
      <p className={cn('text-fg m-0 font-semibold', size === 'sm' ? 'text-sm' : 'text-base')}>
        {title}
      </p>
      {description ? (
        <p className="text-fg-muted m-0 max-w-sm text-sm text-balance">{description}</p>
      ) : null}
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
