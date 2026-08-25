import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { PostJobForm } from './post-job-form';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

export const metadata = { title: 'New job' };

export default async function PostJobPage() {
  const user = await requireRole('COMPANY');
  const profile = await db.companyProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect('/employer-setup');

  return (
    <main>
      {/* No `actions` slot: on a form view the save action lives in the sheet's
          dirty bar, which is where an unsaved record's controls belong. */}
      <ControlPanel
        breadcrumb={
          <Breadcrumb items={[{ label: 'Jobs', href: '/company/jobs' }, { label: 'New' }]} />
        }
      />
      <ConsoleWidth className="max-w-5xl py-3">
        <PostJobForm />
      </ConsoleWidth>
    </main>
  );
}
