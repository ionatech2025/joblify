import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ResumeBuilderForm } from './builder-form';
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
      <div className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-4">
        <p className="text-fg-muted mb-2 text-[13px]">
          Generate a PDF resume from your profile — headline, bio, skills, and experience.
        </p>
        <ResumeBuilderForm initialEntries={initialEntries} />
      </div>
    </main>
  );
}
