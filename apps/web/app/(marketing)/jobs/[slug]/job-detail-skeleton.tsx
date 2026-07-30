import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton } from '@/app/components/ui/skeleton';

/**
 * JD title-band placeholder: eyebrow bar, display-title block, meta chip pills.
 *
 * Shared by `loading.tsx` and the route's own `<Suspense>` fallback in
 * `page.tsx` — they used to hold byte-identical copies of this markup, kept in
 * step by a comment. One component means a change to the real header can't
 * leave one of the two behind.
 */
export function JobDetailSkeleton() {
  return (
    <main>
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
    </main>
  );
}
