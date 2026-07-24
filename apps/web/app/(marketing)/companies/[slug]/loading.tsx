import { AmbientBand } from '@/app/components/ui/ambient';

// Mirrors the page's own Suspense fallback (ambient header band with logo
// block + eyebrow + display-title pulses). Sitting above the page, it also
// gives the route a Suspense boundary over its `await params`, so the static
// shell (with this skeleton in the hole) can prerender under cacheComponents.
export default function CompanyDetailLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-10 sm:px-6">
          <div className="size-[72px] animate-pulse rounded-2xl bg-neutral-200" />
          <div>
            <div className="h-3 w-32 animate-pulse rounded-full bg-indigo-200/70" />
            <div className="mt-3 h-8 w-64 animate-pulse rounded-2xl bg-neutral-200" />
          </div>
        </div>
      </AmbientBand>
    </main>
  );
}
