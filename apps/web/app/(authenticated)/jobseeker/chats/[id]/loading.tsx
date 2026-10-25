import { ChatThreadSkeleton } from '@/app/components/chat/chat-thread-skeleton';
import { ControlPanelSkeleton } from '@/app/components/console/skeleton';
import { Skeleton } from '@/app/components/ui/skeleton';

// Console route fallback: the control-panel bar over the 2-column ChatThread +
// room-details sidebar layout of app/(authenticated)/jobseeker/chats/[id]/page.tsx.
export default function Loading() {
  return (
    <main>
      <ControlPanelSkeleton />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-4 px-3 py-3 sm:px-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="lg:col-span-2">
          <Skeleton className="h-4 w-48" />
        </section>
        <section>
          <ChatThreadSkeleton />
        </section>
        <aside className="o-sheet flex flex-col gap-3 p-3.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="rounded-control h-10 w-full" />
          <Skeleton className="rounded-control h-16 w-full" />
        </aside>
      </div>
    </main>
  );
}
