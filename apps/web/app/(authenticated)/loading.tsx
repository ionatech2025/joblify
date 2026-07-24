import { AmbientBand } from '@/app/components/ui/ambient';

// Route-level loading state for the authenticated area: pulse blocks in the
// shape of a standard dashboard page (PageHeader title band + a card list),
// mirroring JobDetailSkeleton's visual language. Dumb server component — it
// paints instantly on navigation while the page's dynamic data streams in.
export default function AuthenticatedLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="h-8 w-64 animate-pulse rounded bg-neutral-200" />
          <div className="mt-4 h-4 w-40 animate-pulse rounded bg-neutral-100" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-neutral-200 bg-white/70" />
          ))}
        </div>
      </div>
    </main>
  );
}
