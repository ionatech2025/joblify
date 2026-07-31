import { Card } from '@/app/components/ui/card';
import { Skeleton, SkeletonCard } from '@/app/components/ui/skeleton';

/**
 * Placeholder for `ApplicantsBoard`: the sort/filter toolbar row, then five
 * stage-column cards (the open stages shown by default; the three closed
 * ones sit behind a toggle) each holding a couple of applicant-card
 * placeholders — a horizontally-scrolling kanban, not a list.
 *
 * Shared by this route's `loading.tsx` and the inline `<Suspense>` boundary
 * `page.tsx` wraps `ApplicantsBoard` in (it reads `useSearchParams()` for its
 * sort/showClosed state, which requires a Suspense ancestor) — one shape
 * instead of two hand-copied ones.
 */
export function ApplicantsBoardSkeleton() {
  return (
    <>
      <div className="my-4 flex flex-wrap items-center gap-5">
        <Skeleton className="rounded-control h-11 w-44" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i} tone="glass" className="w-[280px] shrink-0">
            <Skeleton className="mb-3 h-4 w-24" />
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: i % 2 === 0 ? 3 : 2 }, (_, j) => (
                <SkeletonCard key={j} className="h-32" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
