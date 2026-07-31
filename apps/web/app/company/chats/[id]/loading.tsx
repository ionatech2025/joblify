import { ChatThreadSkeleton } from '@/app/components/chat/chat-thread-skeleton';
import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonCard, SkeletonTitle } from '@/app/components/ui/skeleton';

// Loading state for /company/chats/[id]: two-column layout — message thread
// and composer on the left, a fixed-width participants sidebar on the right —
// not a single-column list. Mirrors CompanyChatAreaPage's
// grid-cols-[1fr_260px] split.
export default function CompanyChatAreaLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto flex max-w-4xl flex-wrap items-end justify-between gap-4 px-4 py-10 sm:px-6">
          <div>
            <SkeletonTitle className="w-56" />
            <Skeleton className="mt-4 h-4 w-72" />
          </div>
          <Skeleton className="h-4 w-28" />
        </div>
      </AmbientBand>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_260px]">
        <section>
          <ChatThreadSkeleton />
        </section>
        <aside>
          <Skeleton className="h-3 w-28" />
          <div className="mt-2 flex flex-col gap-2">
            <SkeletonCard className="h-11" />
            <SkeletonCard className="h-11" />
            <SkeletonCard className="h-11" />
          </div>
          <Skeleton className="mt-6 h-3 w-32" />
          <div className="mt-2 flex flex-col gap-2">
            <SkeletonCard className="h-11" />
            <SkeletonCard className="h-11" />
          </div>
        </aside>
      </div>
    </main>
  );
}
