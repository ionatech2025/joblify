import { Skeleton } from '@/app/components/ui/skeleton';

// Field-shaped placeholders mirroring JobFormFields — title input, long
// description + requirements textareas, the two 2-up select rows, location,
// the 3-up salary row, deadline, and the two checkbox lines. Shared by the
// create (/company/jobs/new) and edit (/company/jobs/[id]/edit) loading
// states so the two forms, which already share these real fields, can't
// drift apart here either.
export function JobFormFieldsSkeleton() {
  return (
    <>
      <Skeleton className="rounded-control h-11" />
      <Skeleton className="rounded-control h-40" />
      <Skeleton className="rounded-control h-28" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="rounded-control h-11" />
        <Skeleton className="rounded-control h-11" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="rounded-control h-11" />
        <Skeleton className="rounded-control h-11" />
      </div>
      <Skeleton className="rounded-control h-11" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_120px]">
        <Skeleton className="rounded-control h-11" />
        <Skeleton className="rounded-control h-11" />
        <Skeleton className="rounded-control h-11" />
      </div>
      <Skeleton className="rounded-control h-11" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-4 w-80" />
    </>
  );
}
