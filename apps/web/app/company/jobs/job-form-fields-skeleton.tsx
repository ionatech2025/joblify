import { Skeleton } from '@/app/components/ui/skeleton';

// Sheet-shaped placeholders mirroring JobFormFields: the title row with its
// statusbar, two columns of label:value groups (classification / location &
// compensation), then the notebook tab strip over the description textarea.
// Shared by the create (/company/jobs/new) and edit (/company/jobs/[id]/edit)
// loading states so the two forms, which already share these real fields, can't
// drift apart here either.
export function JobFormFieldsSkeleton() {
  return (
    <div className="o-sheet px-4 py-4 sm:px-6 sm:py-5">
      <div className="border-border mb-4 flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div className="min-w-[16rem] flex-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="rounded-control mt-1 h-9 w-full" />
        </div>
        <Skeleton className="rounded-control h-6 w-44" />
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
        {[4, 3].map((rows, g) => (
          <div key={g}>
            <Skeleton className="mb-2.5 h-3 w-32" />
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: rows }, (_, r) => (
                <div key={r} className="grid grid-cols-[9.5rem_1fr] items-center gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="rounded-control h-8 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-border mt-5 flex gap-3 border-b pb-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="rounded-control mt-4 h-48 w-full" />

      <div className="border-border mt-5 flex items-center justify-between gap-4 border-t pt-2.5">
        <Skeleton className="h-3 w-28" />
        <div className="flex gap-2">
          <Skeleton className="rounded-control h-8 w-20" />
          <Skeleton className="rounded-control h-8 w-28" />
        </div>
      </div>
    </div>
  );
}
