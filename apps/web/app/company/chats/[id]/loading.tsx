import { ChatThreadSkeleton } from '@/app/components/chat/chat-thread-skeleton';
import { ControlPanelSkeleton } from '@/app/components/console/skeleton';
import { Skeleton } from '@/app/components/ui/skeleton';

// Console route fallback: the control-panel bar over the 2-column chat +
// participant sidebar layout of app/company/chats/[id]/page.tsx, at the real
// heights so the swap costs no layout shift.
export default function Loading() {
  return (
    <main>
      <ControlPanelSkeleton />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-3 py-3 sm:px-4 lg:grid-cols-[1fr_260px]">
        <section className="lg:col-span-2">
          <Skeleton className="h-4 w-56" />
        </section>
        <section>
          <ChatThreadSkeleton />
        </section>
        <aside className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="rounded-card h-12 w-full" />
          <Skeleton className="rounded-card h-12 w-full" />
        </aside>
      </div>
    </main>
  );
}
