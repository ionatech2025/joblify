import type { ReactNode } from 'react';
import type { StatusTone } from '@/lib/ui/status';
import { cn } from '@/lib/cn';

/** Horizontally scrolling board. One `KanbanColumn` per pipeline stage. */
export function KanbanBoard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2 overflow-x-auto pb-2', className)}>{children}</div>
  );
}

const SEGMENT: Record<StatusTone, string> = {
  brand: 'bg-brand-solid',
  neutral: 'bg-border-strong',
  success: 'bg-success',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
};

export type ColumnSegment = { tone: StatusTone; count: number; label: string };

/**
 * A kanban column. Two things here that the previous board did not have:
 *
 *  - an **aggregate** under the title, so a column says something about its
 *    contents ("avg match 68%") rather than only how many there are;
 *  - a **progress bar** segmented by a secondary dimension. Odoo uses it for
 *    sub-state; on the applicants board it splits a stage by match strength, so
 *    "9 shortlisted" also tells you at a glance whether they are strong
 *    candidates or a pile of weak ones.
 *
 * The bar is decorative — its numbers are also written out in the visually
 * hidden summary, because a colour ratio is not information for a screen
 * reader or for anyone who can't separate the hues.
 */
export function KanbanColumn({
  title,
  count,
  aggregate,
  segments,
  children,
  className,
}: {
  title: string;
  count: number;
  aggregate?: ReactNode;
  segments?: ColumnSegment[];
  children: ReactNode;
  className?: string;
}) {
  const segTotal = segments?.reduce((n, s) => n + s.count, 0) ?? 0;
  return (
    <section
      aria-label={`${title}, ${count} ${count === 1 ? 'card' : 'cards'}`}
      className={cn(
        'border-border bg-surface-sunken rounded-card flex w-[270px] shrink-0 flex-col border',
        className,
      )}
    >
      <header className="border-border border-b px-2.5 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-fg truncate text-[13px] font-semibold" title={title}>
            {title}
          </h3>
          <span className="text-fg-muted shrink-0 text-[12px] font-semibold tabular-nums">
            {count}
          </span>
        </div>
        {aggregate ? <p className="text-fg-subtle mt-0.5 text-[11px]">{aggregate}</p> : null}
        {segments && segTotal > 0 ? (
          <>
            <div
              aria-hidden
              className="bg-border mt-1.5 flex h-1 overflow-hidden rounded-pill"
              title={segments.map((s) => `${s.count} ${s.label}`).join(' · ')}
            >
              {segments
                .filter((s) => s.count > 0)
                .map((s) => (
                  <span
                    key={s.label}
                    className={SEGMENT[s.tone]}
                    style={{ width: `${(s.count / segTotal) * 100}%` }}
                  />
                ))}
            </div>
            <p className="sr-only">
              {segments
                .filter((s) => s.count > 0)
                .map((s) => `${s.count} ${s.label}`)
                .join(', ')}
            </p>
          </>
        ) : null}
      </header>
      <div className="flex flex-col gap-1.5 p-1.5">{children}</div>
    </section>
  );
}

/** A record card inside a column. */
export function KanbanCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <article
      className={cn(
        'border-border bg-surface rounded-card hover:border-border-strong border px-2.5 py-2 transition-colors',
        className,
      )}
    >
      {children}
    </article>
  );
}
