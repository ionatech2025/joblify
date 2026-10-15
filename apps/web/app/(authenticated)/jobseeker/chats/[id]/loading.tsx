import { ChatThreadSkeleton } from '@/app/components/chat/chat-thread-skeleton';
import { ConsoleWidth } from '@/app/components/console/shell';
import { ControlPanelSkeleton } from '@/app/components/console/skeleton';
import { Skeleton } from '@/app/components/ui/skeleton';

// Console route fallback: the control-panel bar over the ChatThread +
// ChatComposer skeleton at max-w-4xl, matching app/(authenticated)/jobseeker/chats/[id]/page.tsx.
export default function Loading() {
  return (
    <main>
      <ControlPanelSkeleton />
      <ConsoleWidth className="max-w-4xl py-3">
        <Skeleton className="mb-2 h-4 w-48" />
        <ChatThreadSkeleton />
      </ConsoleWidth>
    </main>
  );
}
