import { ConsoleWidth } from '@/app/components/console/shell';
import { ControlPanelSkeleton } from '@/app/components/console/skeleton';
import { ApplicantsBoardSkeleton } from './applicants-board-skeleton';

// Loading state for /company/applicants/[jobId]: the control-panel bar over the
// kanban board shape, rather than the generic console list. The board markup
// lives in applicants-board-skeleton.tsx.
export default function ApplicantsLoading() {
  return (
    <main>
      <ControlPanelSkeleton />
      <ConsoleWidth className="py-3">
        <ApplicantsBoardSkeleton />
      </ConsoleWidth>
    </main>
  );
}
