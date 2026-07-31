import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonTitle } from '@/app/components/ui/skeleton';
import { JobFormFieldsSkeleton } from '@/app/company/jobs/job-form-fields-skeleton';

// Loading state for /company/jobs/[id]/edit: the same long-form shape as
// /company/jobs/new (shared JobFormFieldsSkeleton), plus the status line
// EditJobPage prints above the form and the Save + Delete button pair
// EditJobForm adds below it. No subtitle bar in the title band — the real
// PageHeader here doesn't set one either.
export default function EditJobLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <SkeletonTitle className="w-40" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="mt-6 flex flex-col gap-4">
          <JobFormFieldsSkeleton />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>
    </main>
  );
}
