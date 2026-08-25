import type { ReactNode } from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';
import { ConsoleShell, ConsoleWidth } from './shell';

/**
 * Console chrome fallbacks — the module nav and the control panel, at their
 * real heights.
 *
 * The heights matter more here than in the editorial skeletons: both bars are
 * sticky and the control panel computes its `top` from `--o-nav-h`, so a
 * fallback even a few pixels short makes the whole page jump when the real
 * chrome swaps in.
 */
function ConsoleNavSkeleton() {
  return (
    <div className="o-chrome-bar border-b">
      <ConsoleWidth className="flex h-[calc(var(--o-nav-h)-1px)] items-center gap-4">
        <Skeleton className="h-3.5 w-24" />
        {['w-14', 'w-20', 'w-16', 'w-24'].map((w) => (
          <Skeleton key={w} className={`rounded-control h-3 ${w}`} />
        ))}
      </ConsoleWidth>
    </div>
  );
}

/** Breadcrumb line plus the actions/search/views row. */
export function ControlPanelSkeleton() {
  return (
    <div className="o-chrome-bar border-b">
      <ConsoleWidth className="py-1.5">
        <div className="flex min-h-7 items-center">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <Skeleton className="rounded-control h-6 w-16" />
          <Skeleton className="rounded-control h-6 w-48" />
          <Skeleton className="rounded-control ml-auto h-6 w-14" />
        </div>
      </ConsoleWidth>
    </div>
  );
}

/** Dense row placeholders in the shape of a `ListView`. */
export function ConsoleListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="border-border bg-surface rounded-card overflow-hidden border">
      <div className="border-border bg-surface-sunken border-b px-2.5 py-2">
        <Skeleton className="h-3 w-40" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="border-border flex items-center gap-4 border-b px-2.5 py-2.5 last:border-0"
        >
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="ml-auto h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

/** Sheet-shaped fallback: title zone plus two columns of label:value rows. */
export function ConsoleSheetSkeleton({ groups = 2, rowsPerGroup = 4 }) {
  return (
    <div className="o-sheet px-4 py-4 sm:px-6 sm:py-5">
      <div className="border-border mb-4 flex items-start justify-between border-b pb-4">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="rounded-control h-5 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
        {Array.from({ length: groups }, (_, g) => (
          <div key={g}>
            <Skeleton className="mb-2.5 h-3 w-28" />
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: rowsPerGroup }, (_, r) => (
                <div key={r} className="grid grid-cols-[9.5rem_1fr] items-center gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="rounded-control h-7 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Whole-page console fallback, used by the layout-level Suspense gates where
 * even the module nav hasn't resolved yet.
 */
export function ConsolePageSkeleton({ children }: { children?: ReactNode }) {
  return (
    <ConsoleShell>
      <ConsoleNavSkeleton />
      <ControlPanelSkeleton />
      <ConsoleWidth className="py-3">{children ?? <ConsoleListSkeleton />}</ConsoleWidth>
    </ConsoleShell>
  );
}
