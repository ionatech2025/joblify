'use client';

import Link from 'next/link';
import type { StatusTone } from '@/lib/ui/status';
import { cn } from '@/lib/cn';

export type Stage = {
  key: string;
  label: string;
  /** Colours the stage when it is the current one — e.g. a rejection is danger. */
  tone?: StatusTone;
};

// Fill for the *current* stage only; every other stage is a flat well. Odoo
// colours the whole bar one shade and marks position by fill, not by hue, so
// the pipeline still reads left-to-right at a glance.
const CURRENT: Record<StatusTone, string> = {
  brand: 'bg-ink text-ink-fg',
  neutral: 'bg-fg-muted text-fg-inverse',
  success: 'bg-success text-fg-inverse',
  warn: 'bg-warn text-fg-inverse',
  danger: 'bg-danger text-fg-inverse',
  info: 'bg-info text-fg-inverse',
};

/**
 * Statusbar — the arrow pipeline at the top-right of an Odoo form. It answers
 * two questions at once that a `<select>` answers neither of: where in the
 * process is this record, and what comes next.
 *
 * That is the concrete upgrade for the applicants board, where moving someone
 * forward used to mean opening a dropdown inside their card, scrolling a list
 * of eight statuses and picking the adjacent one — three interactions to
 * express "advance by one". Here the next stage is a single click, and the
 * whole path is visible without opening anything.
 *
 * `onSelect` makes stages buttons, `hrefFor` makes them links, neither makes
 * them a static indicator. Stages before the current one stay clickable: moving
 * a candidate *back* is a real recruiter action.
 */
export function Statusbar({
  stages,
  current,
  onSelect,
  hrefFor,
  disabled = false,
  label = 'Stage',
  className,
}: {
  stages: Stage[];
  current: string;
  onSelect?: (key: string) => void;
  hrefFor?: (key: string) => string;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap items-stretch', className)}>
      {stages.map((s) => {
        const isCurrent = s.key === current;
        const shape =
          'o-stage inline-flex items-center py-1 text-[11px] font-semibold tracking-wide uppercase transition-colors';
        const look = isCurrent
          ? CURRENT[s.tone ?? 'brand']
          : 'bg-surface-sunken text-fg-muted hover:bg-border hover:text-fg';

        const content = (
          <>
            {s.label}
            {isCurrent ? <span className="sr-only"> (current stage)</span> : null}
          </>
        );

        if (isCurrent || disabled || (!onSelect && !hrefFor)) {
          return (
            <span
              key={s.key}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(shape, look, disabled && !isCurrent && 'opacity-60')}
            >
              {content}
            </span>
          );
        }
        if (hrefFor) {
          return (
            <Link
              key={s.key}
              href={hrefFor(s.key)}
              scroll={false}
              className={cn(shape, look, 'no-underline')}
            >
              {content}
            </Link>
          );
        }
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onSelect?.(s.key)}
            className={cn(shape, look, 'cursor-pointer')}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
