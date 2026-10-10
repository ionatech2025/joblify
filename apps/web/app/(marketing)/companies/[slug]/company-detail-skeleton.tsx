import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonList, SkeletonText } from '@/app/components/ui/skeleton';

/**
 * Company placeholder: header band (logo block beside eyebrow + display title)
 * followed by the about copy and open-role cards. The body and `min-h-svh` keep
 * the footer below the fold while the page streams in; see
 * jobs/[slug]/job-detail-skeleton.tsx for the measurement behind it.
 *
 * Shared by `loading.tsx` and the route's own `<Suspense>` fallback in
 * `page.tsx`, which previously duplicated this markup verbatim.
 */
export function CompanyDetailSkeleton() {
  return (
    <main className="min-h-svh">
      <AmbientBand>
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-10 sm:px-6">
          <Skeleton className="rounded-card size-[72px]" />
          <div>
            <Skeleton className="bg-brand-subtle h-3 w-32" />
            <Skeleton className="rounded-card mt-3 h-8 w-64" />
          </div>
        </div>
      </AmbientBand>
      <div aria-hidden="true" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <SkeletonText lines={4} />
        <SkeletonList count={3} className="mt-10" />
      </div>
    </main>
  );
}
