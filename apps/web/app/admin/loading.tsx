import { ConsoleWidth } from '@/app/components/console/shell';
import { ConsoleListSkeleton, ControlPanelSkeleton } from '@/app/components/console/skeleton';

// Loading state for /admin. Also gives the route a Suspense boundary over its
// session read (requireRole), so the static shell can prerender under
// cacheComponents.
export default function AdminLoading() {
  return (
    <main>
      <ControlPanelSkeleton />
      <ConsoleWidth className="max-w-6xl py-3">
        <ConsoleListSkeleton rows={4} />
      </ConsoleWidth>
    </main>
  );
}
