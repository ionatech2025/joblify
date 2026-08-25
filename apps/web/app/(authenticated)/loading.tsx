import { ConsoleWidth } from '@/app/components/console/shell';
import { ConsoleListSkeleton, ControlPanelSkeleton } from '@/app/components/console/skeleton';

// Route-level loading state for the authenticated console: the control-panel bar
// over dense list rows. The module nav belongs to whichever sub-shell owns it
// (jobseeker), which has already resolved by the time this paints.
export default function AuthenticatedLoading() {
  return (
    <main>
      <ControlPanelSkeleton />
      <ConsoleWidth className="py-3">
        <ConsoleListSkeleton />
      </ConsoleWidth>
    </main>
  );
}
