import { ConsoleWidth } from '@/app/components/console/shell';
import { ConsoleListSkeleton, ControlPanelSkeleton } from '@/app/components/console/skeleton';

// Fallback for the account tools (/account/export, /account/delete): the
// control-panel bar over dense rows.
//
// This used to sit at (authenticated) level, where it wrapped every route in
// the group in a Suspense boundary — including ones with their own, better
// matched loading.tsx, whose fallback then never got used. Onboarding in
// particular was preceded in its prerendered shell by a fallback shaped like a
// data table. Each segment that needs a fallback now declares its own.
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
