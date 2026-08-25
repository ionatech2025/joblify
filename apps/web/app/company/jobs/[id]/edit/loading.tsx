import { ConsoleWidth } from '@/app/components/console/shell';
import { ControlPanelSkeleton } from '@/app/components/console/skeleton';
import { JobFormFieldsSkeleton } from '@/app/company/jobs/job-form-fields-skeleton';

// Loading state for the job form views: the control-panel bar over the sheet
// shape (title + statusbar, two label:value groups, notebook, dirty bar). Both
// /company/jobs/new and /company/jobs/[id]/edit render the same form, so they
// share one fallback — see job-form-fields-skeleton.tsx.
export default function JobFormLoading() {
  return (
    <main>
      <ControlPanelSkeleton />
      <ConsoleWidth className="max-w-5xl py-3">
        <JobFormFieldsSkeleton />
      </ConsoleWidth>
    </main>
  );
}
