import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTitle } from '@/app/components/ui/skeleton';

// Route-level loading state for the company dashboard: pulse blocks in the
// shape of a standard company page (PageHeader title band with an action +
// a stat strip + a card list). Paints below the persistent company sub-nav
// while page data streams in.
export default function CompanyLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4 px-4 py-10 sm:px-6">
          <div>
            <SkeletonTitle />
            <Skeleton className="mt-4 h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <SkeletonCard />
        <SkeletonList count={4} className="mt-6" />
      </div>
    </main>
  );
}
