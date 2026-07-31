import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonCard, SkeletonTitle } from '@/app/components/ui/skeleton';

// Loading state for /onboarding: two side-by-side choice cards (job seeker /
// company), not a list. Each card reserves a heading + description lines plus
// its own action(s) — the job-seeker card ends in two stacked buttons, the
// company card in one.
export default function OnboardingLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <SkeletonTitle className="w-72" />
          <Skeleton className="mt-4 h-4 w-96" />
        </div>
      </AmbientBand>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6">
        <SkeletonCard className="flex h-auto flex-col gap-4 p-6">
          <div>
            <Skeleton className="h-5 w-56" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-11/12" />
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </SkeletonCard>
        <SkeletonCard className="flex h-auto flex-col gap-4 p-6">
          <div>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-4/5" />
          </div>
          <Skeleton className="mt-auto h-10 w-full" />
        </SkeletonCard>
      </div>
    </main>
  );
}
