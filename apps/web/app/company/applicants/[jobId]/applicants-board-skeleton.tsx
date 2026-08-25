import { Skeleton } from '@/app/components/ui/skeleton';

/**
 * Placeholder for `ApplicantsBoard`: five kanban stage columns (the open ones
 * shown by default; the three closed stages sit behind a control-panel filter)
 * each holding a couple of applicant-card placeholders.
 *
 * Matches the real column geometry — 270px wide, header with a title/count row
 * and the match-strength progress bar — so the swap costs no layout shift.
 */
export function ApplicantsBoardSkeleton() {
  return (
    <div className="flex items-start gap-2 overflow-x-auto pb-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="border-border bg-surface-sunken rounded-card w-[270px] shrink-0 border"
        >
          <div className="border-border border-b px-2.5 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-4" />
            </div>
            <Skeleton className="mt-1 h-2 w-24" />
            <Skeleton className="rounded-pill mt-1.5 h-1 w-full" />
          </div>
          <div className="flex flex-col gap-1.5 p-1.5">
            {Array.from({ length: i % 2 === 0 ? 3 : 2 }, (_, j) => (
              <div key={j} className="border-border bg-surface rounded-card border px-2.5 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="mt-1 h-2 w-32" />
                <Skeleton className="mt-1 h-2 w-20" />
                <Skeleton className="rounded-control mt-2 h-6 w-full" />
                <Skeleton className="rounded-control mt-1.5 h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
