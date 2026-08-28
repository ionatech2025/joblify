import { Skeleton } from '@/app/components/ui/skeleton';
import { ControlPanelSkeleton } from '@/app/components/console/skeleton';

// Fallback for client-side navigations into /onboarding. The page itself is
// mostly static now and prerenders into the CDN shell, so this is rarely on
// screen — but when it is, it has to be the shape of what follows: two choice
// cards at max-w-4xl. It used to render a sheet-shaped form skeleton at
// max-w-5xl, which predicted a layout the page never had.
export default function Loading() {
  return (
    <main>
      <ControlPanelSkeleton />
      <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-4">
        <Skeleton className="mb-2 h-4 w-72" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-card border-border bg-surface shadow-soft flex flex-col gap-4 border p-6"
            >
              <Skeleton className="h-6 w-52" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <div className="mt-auto flex flex-col gap-2">
                <Skeleton className="rounded-pill h-9 w-full" />
                {i === 0 && <Skeleton className="rounded-pill h-9 w-full" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
