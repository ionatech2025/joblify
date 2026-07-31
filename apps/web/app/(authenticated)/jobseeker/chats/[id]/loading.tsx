import { ChatThreadSkeleton } from '@/app/components/chat/chat-thread-skeleton';
import { AmbientBand } from '@/app/components/ui/ambient';
import { Skeleton, SkeletonTitle } from '@/app/components/ui/skeleton';

// Loading state for /jobseeker/chats/[id]: single-column thread + composer.
// Unlike the company side, this route has no participants sidebar, so there
// is no lg:grid-cols split here — just the title band over the job-post line
// and the thread.
export default function JobseekerChatAreaLoading() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto flex max-w-3xl flex-wrap items-end justify-between gap-4 px-4 py-10 sm:px-6">
          <div>
            <SkeletonTitle className="w-56" />
            <Skeleton className="mt-4 h-4 w-72" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </AmbientBand>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-4 w-56" />
        <ChatThreadSkeleton />
      </div>
    </main>
  );
}
