import { AmbientBand } from '@/app/components/ui/ambient';

// Loading state for the apply flow: pulse blocks matching the real page —
// PageHeader title band (max-w-3xl, eyebrow + display title) over the form's
// rounded-xl field column and pill submit. Dumb server component.
export default function ApplyLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="h-3 w-24 animate-pulse rounded-full bg-indigo-200/70" />
          <div className="mt-4 h-8 w-2/3 animate-pulse rounded-2xl bg-neutral-200" />
          <div className="mt-4 h-4 w-1/3 animate-pulse rounded-full bg-neutral-100" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="h-11 animate-pulse rounded-xl bg-neutral-100" />
          <div className="h-11 animate-pulse rounded-xl bg-neutral-100" />
          <div className="h-28 animate-pulse rounded-xl bg-neutral-100" />
          <div className="h-10 w-44 animate-pulse rounded-full bg-neutral-200" />
        </div>
      </div>
    </main>
  );
}
