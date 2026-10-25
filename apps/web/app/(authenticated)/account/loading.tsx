import { ConsoleWidth } from '@/app/components/console/shell';
import { ConsoleSheetSkeleton, ControlPanelSkeleton } from '@/app/components/console/skeleton';

// Fallback for the account tools (/account/export, /account/delete): the
// control-panel bar over a sheet-shaped card at max-w-3xl.
export default function AuthenticatedLoading() {
  return (
    <main>
      <ControlPanelSkeleton />
      <ConsoleWidth className="max-w-3xl py-3">
        <ConsoleSheetSkeleton groups={1} rowsPerGroup={2} />
      </ConsoleWidth>
    </main>
  );
}
