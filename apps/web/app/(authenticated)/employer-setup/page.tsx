import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { EmployerSetupForm } from './employer-setup-form';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

export const metadata = { title: 'Set up your company' };

export default async function EmployerSetupPage() {
  const user = await requireUser();
  const [existing, jobSeekerProfile] = await Promise.all([
    db.companyProfile.findUnique({ where: { userId: user.id }, select: { id: true } }),
    db.jobSeekerProfile.findUnique({ where: { userId: user.id }, select: { id: true } }),
  ]);
  if (existing) redirect('/company/jobs');

  return (
    <main>
      <ControlPanel breadcrumb={<Breadcrumb items={[{ label: 'Company setup' }]} />} />
      <div className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-4">
        <p className="text-fg-muted mb-2 text-[13px]">
          Create your company profile to start posting jobs and reviewing applicants.
        </p>
        <EmployerSetupForm hasJobSeekerIdentity={Boolean(jobSeekerProfile)} />
      </div>
    </main>
  );
}
