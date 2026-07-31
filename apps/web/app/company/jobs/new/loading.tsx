import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonTitle } from '@/app/components/ui/skeleton';
import { JobFormFieldsSkeleton } from '@/app/company/jobs/job-form-fields-skeleton';

// Loading state for /company/jobs/new: PageHeader title band over the long
// PostJobForm — field-sized bars ending in a submit button, not the company
// shell's generic stat+list shape. Renders below the shell's real pill-nav,
// which is already mounted by the time this route-level Suspense fires, so
// no nav placeholder is drawn here.
export default function PostJobLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <SkeletonTitle className="w-48" />
          <Skeleton className="mt-4 h-4 w-96" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mt-6 flex flex-col gap-4">
          <JobFormFieldsSkeleton />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </main>
  );
}
