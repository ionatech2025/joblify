import { AmbientBand } from '@/app/components/ui/ambient';

// Loading state for /admin: pulse blocks matching the real page — title band,
// the three stat cards, then the verification queue list. Also gives the
// route a Suspense boundary over its session read (requireRole), so the
// static shell can prerender under cacheComponents.
export default function AdminLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="h-8 w-40 animate-pulse rounded bg-neutral-200" />
          <div className="mt-4 h-4 w-64 animate-pulse rounded bg-neutral-100" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-neutral-200 bg-white/70" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-neutral-200 bg-white/70" />
          ))}
        </div>
      </div>
    </main>
  );
}
