import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonTitle } from '@/app/components/ui/skeleton';

// Loading state for /company/settings: title band, then the logo uploader row
// (square logo placeholder + upload button) above a shorter field stack than
// the job forms — matches CompanySettingsForm's shape, not a stat+list.
export default function CompanySettingsLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <SkeletonTitle className="w-56" />
          <Skeleton className="mt-4 h-4 w-96" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mt-6">
          <div className="border-border mb-6 flex items-center gap-4 border-b pb-6">
            <Skeleton className="rounded-control size-16" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="rounded-control h-11" />
            <Skeleton className="rounded-control h-11" />
            <Skeleton className="rounded-control h-11" />
            <Skeleton className="rounded-control h-28" />
            <Skeleton className="rounded-control h-11" />
            <Skeleton className="rounded-control h-11" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </main>
  );
}
