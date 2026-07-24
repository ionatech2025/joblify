import { AmbientBand } from '@/app/components/ui/ambient';

// Route-level loading state for the authenticated area: pulse blocks in the
// shape of a standard dashboard page (PageHeader title band + a stat strip +
// a card list), mirroring the refreshed card language (rounded-2xl surfaces,
// pill buttons). Dumb server component — it paints instantly on navigation
// while the page's dynamic data streams in.
export default function AuthenticatedLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="h-8 w-64 animate-pulse rounded-full bg-neutral-200" />
          <div className="mt-4 h-4 w-40 animate-pulse rounded-full bg-neutral-100" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="h-24 animate-pulse rounded-2xl border border-neutral-200/80 bg-white/70" />
        <div className="mt-6 grid grid-cols-1 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-neutral-200/80 bg-white/70" />
          ))}
        </div>
        <div className="mt-6 h-9 w-32 animate-pulse rounded-full bg-neutral-200" />
      </div>
    </main>
  );
}
