import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTitle } from '@/app/components/ui/skeleton';

// Route-level loading state for the authenticated area: pulse blocks in the
// shape of a standard dashboard page (PageHeader title band + a stat strip +
// a card list). Dumb server component — it paints instantly on navigation
// while the page's dynamic data streams in.
export default function AuthenticatedLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <SkeletonTitle />
          <Skeleton className="mt-4 h-4 w-40" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <SkeletonCard />
        <SkeletonList count={4} className="mt-6" />
        <Skeleton className="mt-6 h-9 w-32" />
      </div>
    </main>
  );
}
