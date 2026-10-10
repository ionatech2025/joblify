import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonCard, SkeletonText } from '@/app/components/ui/skeleton';

/**
 * JD placeholder: title band (eyebrow bar, display-title block, meta chip pills)
 * followed by body copy and the apply card.
 *
 * The body is reserved on purpose. With only the band here the shell was about
 * 200px tall, so the footer sat in view while the job loaded and was then
 * pushed a full page down: CLS 0.41 on a throttled mobile run, from one
 * element. `min-h-svh` additionally keeps the footer below the fold whatever
 * the real content's height turns out to be; the real <main> carries the same
 * class so a short job does not pull it back up.
 *
 * Shared by `loading.tsx` and the route's own `<Suspense>` fallback in
 * `page.tsx` — they used to hold byte-identical copies of this markup, kept in
 * step by a comment. One component means a change to the real header can't
 * leave one of the two behind.
 */
export function JobDetailSkeleton() {
  return (
    <main className="min-h-svh">
      <AmbientBand>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Skeleton className="bg-brand-subtle h-3 w-28" />
          <Skeleton className="rounded-card mt-4 h-10 w-2/3" />
          <div className="mt-5 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="bg-border-strong h-6 w-36" />
          </div>
        </div>
      </AmbientBand>
      <div aria-hidden="true" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <SkeletonText lines={6} />
        <SkeletonCard className="mt-12 h-40" />
      </div>
    </main>
  );
}
