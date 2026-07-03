import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfileForm } from './profile-form';
import { BioCoach } from './bio-coach';
import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'My profile' };

export default async function JobseekerProfilePage() {
  const user = await requireRole('JOB_SEEKER');
  const profile = await db.jobSeekerProfile.findUnique({ where: { userId: user.id } });

  return (
    <main>
      <PageHeader
        title="My profile"
        subtitle="These fields show up to recruiters when you apply. Keep your headline and skills sharp."
        width="max-w-3xl"
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <ProfileForm
        initial={{
          profileType: profile?.profileType ?? 'EMPLOYABLE',
          headline: profile?.headline ?? '',
          bio: profile?.bio ?? '',
          yearsExperience: profile?.yearsExperience ?? null,
          location: profile?.location ?? '',
          desiredSalaryMin: profile?.desiredSalaryMin ?? null,
          desiredSalaryMax: profile?.desiredSalaryMax ?? null,
          desiredWorkMode: profile?.desiredWorkMode ?? null,
          visibility: (profile?.visibility as 'PUBLIC' | 'PRIVATE') ?? 'PRIVATE',
          careerInterest: profile?.careerInterest ?? '',
          availabilityHoursPerWeek: profile?.availabilityHoursPerWeek ?? null,
          learningGoal: profile?.learningGoal ?? '',
        }}
      />

      <div className="mt-8">
        <BioCoach currentBio={profile?.bio ?? ''} />
      </div>
      </div>
    </main>
  );
}
