import { ConsoleWidth } from '@/app/components/console/shell';
import { ConsoleSheetSkeleton, ControlPanelSkeleton } from '@/app/components/console/skeleton';

// Console route fallback: the control-panel bar over a sheet-shaped body, at
// the real heights so the swap costs no layout shift. Also gives the route a
// Suspense boundary over its session read, so the static shell can prerender
// under cacheComponents.
export default function Loading() {
  return (
    <main>
      <ControlPanelSkeleton />
      <ConsoleWidth className="max-w-5xl py-3">
        <ConsoleSheetSkeleton />
      </ConsoleWidth>
    </main>
  );
}
