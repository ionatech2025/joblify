import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ResumeBuilderForm } from './builder-form';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

export const metadata = { title: 'Build a resume' };

export default async function ResumeBuilderPage() {
  const user = await requireRole('JOB_SEEKER');
  const profile = await db.jobSeekerProfile.findUnique({
    where: { userId: user.id },
    include: { workExperiences: { orderBy: { createdAt: 'asc' } } },
  });

  const initialEntries = (profile?.workExperiences ?? []).map((e) => ({
    company: e.company,
    title: e.title,
    startDate: e.startDate ?? '',
    endDate: e.endDate ?? '',
    description: e.description ?? '',
  }));

  return (
    <main>
      <ControlPanel
        breadcrumb={
          <Breadcrumb
            items={[{ label: 'Resumes', href: '/jobseeker/resumes' }, { label: 'Builder' }]}
          />
        }
      />
      <ConsoleWidth className="max-w-5xl py-3">
        <ResumeBuilderForm initialEntries={initialEntries} />
      </ConsoleWidth>
    </main>
  );
}
