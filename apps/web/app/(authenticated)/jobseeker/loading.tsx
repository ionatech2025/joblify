import { ConsoleWidth } from '@/app/components/console/shell';
import { ConsoleListSkeleton, ControlPanelSkeleton } from '@/app/components/console/skeleton';

// Fallback for the jobseeker workspace: the control-panel bar over dense list
// rows, which is the shape of applications / saved / matches / notifications.
// The module nav sits above this and stays on screen during tab-to-tab
// navigations — only the page body below it swaps.
//
// Spelled out here rather than re-exported from the group above: that file has
// moved down to account/, so each segment now owns a fallback shaped like the
// thing it precedes instead of one generic list standing in for all of them.
export default function JobseekerLoading() {
  return (
    <main>
      <ControlPanelSkeleton />
      <ConsoleWidth className="py-3">
        <ConsoleListSkeleton />
      </ConsoleWidth>
    </main>
  );
}
