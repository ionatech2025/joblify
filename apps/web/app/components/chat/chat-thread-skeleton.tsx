import { Card } from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';

/**
 * Placeholder for the `ChatThread` + `ChatComposer` pair: a few message-bubble
 * bars of alternating width/alignment inside a Card, then the composer's
 * field stack (message textarea, type + attachment row, send button).
 *
 * Shared by the company and jobseeker chat-area loading states, which both
 * render this exact real component pair back to back — one shape instead of
 * two hand-copied ones.
 */
export function ChatThreadSkeleton() {
  return (
    <>
      <Card>
        <div className="flex flex-col gap-3">
          <Skeleton className="rounded-card h-12 w-2/3 self-start" />
          <Skeleton className="rounded-card h-10 w-1/2 self-end" />
          <Skeleton className="rounded-card h-14 w-3/5 self-start" />
          <Skeleton className="rounded-card h-10 w-2/5 self-end" />
        </div>
      </Card>
      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="rounded-control h-20" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="rounded-control h-11" />
          <Skeleton className="rounded-control h-11" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
    </>
  );
}
