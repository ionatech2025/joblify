import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton } from '@/app/components/ui/skeleton';

// Loading state for the apply flow, sized to the real page — PageHeader title
// band (max-w-3xl, eyebrow + display title) over the form's rounded-control
// field column and pill submit. Dumb server component.
export default function ApplyLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Skeleton className="bg-brand-subtle h-3 w-24" />
          <Skeleton className="rounded-card mt-4 h-8 w-2/3" />
          <Skeleton className="mt-4 h-4 w-1/3" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4">
          <Skeleton className="rounded-control h-11" />
          <Skeleton className="rounded-control h-11" />
          <Skeleton className="rounded-control h-28" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
    </main>
  );
}
