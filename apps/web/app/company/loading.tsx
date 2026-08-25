import { ConsoleListSkeleton, ControlPanelSkeleton } from '@/app/components/console/skeleton';
import { ConsoleWidth } from '@/app/components/console/shell';

// Route-level loading state for the employer console: the control-panel bar
// plus dense list rows, at their real heights, so the swap to real content
// costs no layout shift.
//
// Only the control panel is reserved here — the module nav belongs to the
// layout, which has already resolved by the time a route-level fallback paints.
export default function CompanyLoading() {
  return (
    <main>
      <ControlPanelSkeleton />
      <ConsoleWidth className="py-3">
        <ConsoleListSkeleton />
      </ConsoleWidth>
    </main>
  );
}
