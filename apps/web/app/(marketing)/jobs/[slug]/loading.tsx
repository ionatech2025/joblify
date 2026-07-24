import { AmbientBand } from '@/app/components/ui/ambient';

// Mirrors JobDetailSkeleton in page.tsx. Sitting above the page, it also gives
// the route a Suspense boundary over its `await params`, so the static JD
// shell (with this skeleton in the hole) can prerender under cacheComponents.
export default function JobDetailLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="h-8 w-2/3 animate-pulse rounded bg-neutral-200" />
          <div className="mt-4 h-4 w-1/3 animate-pulse rounded bg-neutral-100" />
        </div>
      </AmbientBand>
    </main>
  );
}
