import { AmbientBand } from '@/app/components/ui/ambient';

// Loading state for /admin: pulse blocks matching the real page — title band,
// the stat strip card, then the verification queue list with pill action
// placeholders. Also gives the route a Suspense boundary over its session
// read (requireRole), so the static shell can prerender under cacheComponents.
export default function AdminLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="h-8 w-40 animate-pulse rounded-full bg-neutral-200" />
          <div className="mt-4 h-4 w-64 animate-pulse rounded-full bg-neutral-100" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8 h-24 animate-pulse rounded-2xl border border-neutral-200/80 bg-white/70" />
        <div className="grid grid-cols-1 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex h-20 items-center justify-between rounded-2xl border border-neutral-200/80 bg-white/70 px-4"
            >
              <div className="h-4 w-40 animate-pulse rounded-full bg-neutral-200" />
              <div className="flex gap-2">
                <div className="h-8 w-16 animate-pulse rounded-full bg-neutral-200" />
                <div className="h-8 w-16 animate-pulse rounded-full bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
