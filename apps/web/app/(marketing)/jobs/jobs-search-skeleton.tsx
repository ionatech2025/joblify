import { Skeleton, SkeletonCard } from '@/app/components/ui/skeleton';

/**
 * Result-card placeholders, sized like a real `JobCard` (logo + three text
 * lines inside p-5). Used both as the Suspense fallback for the whole search
 * UI and while the first query is in flight, so the list area has its final
 * height before the data lands.
 */
export function JobResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul aria-hidden="true" className="m-0 grid list-none grid-cols-1 gap-3 p-0">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <SkeletonCard className="h-28" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Fallback for <JobsSearch>, which suspends on useSearchParams(). Mirrors its
 * grid (260px filter rail + results) so hydration swaps content into a box of
 * the same shape. The previous fallback was a single "Loading…" line, which
 * left the footer in view until the results arrived and then pushed it a full
 * page down — the largest layout shift on the route.
 */
export function JobsSearchSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-8 md:grid-cols-[260px_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="rounded-control h-11 w-full" />
        ))}
      </div>
      <div>
        <Skeleton className="mb-4 h-5 w-24" />
        <JobResultsSkeleton />
      </div>
    </div>
  );
}
