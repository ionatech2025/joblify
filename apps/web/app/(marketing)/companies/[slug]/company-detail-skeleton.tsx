import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton } from '@/app/components/ui/skeleton';

/**
 * Company header-band placeholder: logo block beside eyebrow + display title.
 *
 * Shared by `loading.tsx` and the route's own `<Suspense>` fallback in
 * `page.tsx`, which previously duplicated this markup verbatim.
 */
export function CompanyDetailSkeleton() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-10 sm:px-6">
          <Skeleton className="rounded-card size-[72px]" />
          <div>
            <Skeleton className="bg-brand-subtle h-3 w-32" />
            <Skeleton className="rounded-card mt-3 h-8 w-64" />
          </div>
        </div>
      </AmbientBand>
    </main>
  );
}
