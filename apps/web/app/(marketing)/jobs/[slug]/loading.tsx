import { AmbientBand } from '@/app/components/ui/ambient';

// Mirrors JobDetailSkeleton in page.tsx (eyebrow bar, display-title block, chip
// pills). Sitting above the page, it also gives the route a Suspense boundary
// over its `await params`, so the static JD shell (with this skeleton in the
// hole) can prerender under cacheComponents.
export default function JobDetailLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="h-3 w-28 animate-pulse rounded-full bg-indigo-200/70" />
          <div className="mt-4 h-10 w-2/3 animate-pulse rounded-2xl bg-neutral-200" />
          <div className="mt-5 flex flex-wrap gap-2">
            <div className="h-6 w-24 animate-pulse rounded-full bg-neutral-200" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-200" />
            <div className="h-6 w-36 animate-pulse rounded-full bg-neutral-300" />
          </div>
        </div>
      </AmbientBand>
    </main>
  );
}
