import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ResumeBuilderForm } from './builder-form';
import { PageHeader } from '@/app/components/ui/ambient';

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
      <PageHeader
        title="Build a resume"
        subtitle="Generate a PDF resume from your profile — headline, bio, skills, and the work history below."
        width="max-w-3xl"
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <ResumeBuilderForm initialEntries={initialEntries} />
      </div>
    </main>
  );
}
