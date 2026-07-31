import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonTitle } from '@/app/components/ui/skeleton';

// Loading state for /jobseeker/resumes/builder: a couple of repeated
// work-experience card blocks (each its own bordered card with paired date
// fields and a description) plus the add/save/generate buttons — not a
// stat+list shape.
export default function ResumeBuilderLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <SkeletonTitle className="w-56" />
          <Skeleton className="mt-4 h-4 w-96" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="h-3 w-full max-w-md" />
        <div className="mt-6 flex flex-col gap-4">
          {Array.from({ length: 2 }, (_, i) => (
            <div
              key={i}
              className="border-border bg-surface flex flex-col gap-3 rounded-card border p-4 shadow-soft"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Skeleton className="rounded-control h-11" />
                <Skeleton className="rounded-control h-11" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Skeleton className="rounded-control h-11" />
                <Skeleton className="rounded-control h-11" />
              </div>
              <Skeleton className="rounded-control h-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}

          <Skeleton className="h-8 w-44" />

          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>
    </main>
  );
}
