import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonCard, SkeletonTitle } from '@/app/components/ui/skeleton';

// Loading state for /admin: pulse blocks matching the real page — title band,
// the stat strip card, then the verification queue rows with pill action
// placeholders. Also gives the route a Suspense boundary over its session
// read (requireRole), so the static shell can prerender under cacheComponents.
export default function AdminLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <SkeletonTitle className="w-40" />
          <Skeleton className="mt-4 h-4 w-64" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <SkeletonCard className="mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonCard key={i} className="flex h-20 items-center justify-between px-4">
              <Skeleton className="h-4 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </main>
  );
}
