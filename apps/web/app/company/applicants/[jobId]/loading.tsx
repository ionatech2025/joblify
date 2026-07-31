import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonTitle } from '@/app/components/ui/skeleton';
import { ApplicantsBoardSkeleton } from './applicants-board-skeleton';

// Loading state for /company/applicants/[jobId]: PageHeader title band over
// the ApplicantsBoard shape (toolbar + kanban columns), not the generic
// dashboard's stat+list. The board markup itself lives in
// applicants-board-skeleton.tsx, shared with the page's own inline
// <Suspense> fallback around ApplicantsBoard.
export default function ApplicantsLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-10 sm:px-6">
          <div>
            <SkeletonTitle className="w-72" />
            <Skeleton className="mt-4 h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ApplicantsBoardSkeleton />
      </div>
    </main>
  );
}
