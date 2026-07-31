import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonTitle } from '@/app/components/ui/skeleton';

// Loading state for /jobseeker/profile: a long single-column form (profile
// type, headline, bio, a skills checklist grid, experience, education,
// certifications, portfolio, location, salary range, work mode, visibility)
// followed by the collapsed "Improve my bio with AI" button BioCoach renders
// on first paint — not the generic dashboard's stat+list shape.
export default function JobseekerProfileLoading() {
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
          <Skeleton className="rounded-control h-11" />
          <Skeleton className="rounded-control h-11" />
          <Skeleton className="rounded-control h-32" />

          <div>
            <Skeleton className="h-3 w-16" />
            <div className="border-border-strong mt-1 grid grid-cols-2 gap-x-4 gap-y-2 rounded-control border bg-surface p-3 sm:grid-cols-3">
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
          </div>

          <Skeleton className="rounded-control h-11" />
          <Skeleton className="rounded-control h-20" />
          <Skeleton className="rounded-control h-20" />
          <Skeleton className="rounded-control h-11" />
          <Skeleton className="rounded-control h-11" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="rounded-control h-11" />
            <Skeleton className="rounded-control h-11" />
          </div>

          <Skeleton className="rounded-control h-11" />
          <Skeleton className="rounded-control h-11" />
          <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="mt-8 h-10 w-56" />
      </div>
    </main>
  );
}
