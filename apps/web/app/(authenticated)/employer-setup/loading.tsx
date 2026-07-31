import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonTitle } from '@/app/components/ui/skeleton';

// Loading state for /employer-setup: the pre-company onboarding gate sits
// directly under the authenticated layout (not the jobseeker or company
// shell), so there is no pill-nav to reserve, and the body is one long form —
// not a list. Mirrors EmployerSetupForm's field stack instead of the generic
// dashboard skeleton's stat card + list.
export default function EmployerSetupLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <SkeletonTitle className="w-72" />
          <Skeleton className="mt-4 h-4 w-full" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="rounded-control h-11" />
          <Skeleton className="rounded-control h-11" />
          <Skeleton className="rounded-control h-11" />
          <Skeleton className="rounded-control h-28" />
          <Skeleton className="rounded-control h-11" />
          <Skeleton className="h-10 w-52" />
        </div>
      </div>
    </main>
  );
}
