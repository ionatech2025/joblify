import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfileForm } from './profile-form';
import { BioCoach } from './bio-coach';

export const metadata = { title: 'My profile' };

export default async function JobseekerProfilePage() {
  const user = await requireRole('JOB_SEEKER');
  const profile = await db.jobSeekerProfile.findUnique({ where: { userId: user.id } });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">My profile</h1>
      <p className="mt-1 text-neutral-600">
        These fields show up to recruiters when you apply. Keep your headline and skills sharp.
      </p>
      <ProfileForm
        initial={{
          headline: profile?.headline ?? '',
          bio: profile?.bio ?? '',
          yearsExperience: profile?.yearsExperience ?? null,
          location: profile?.location ?? '',
          desiredSalaryMin: profile?.desiredSalaryMin ?? null,
          desiredSalaryMax: profile?.desiredSalaryMax ?? null,
          desiredWorkMode: profile?.desiredWorkMode ?? null,
          visibility: (profile?.visibility as 'PUBLIC' | 'PRIVATE') ?? 'PRIVATE',
        }}
      />

      <div className="mt-8">
        <BioCoach currentBio={profile?.bio ?? ''} />
      </div>
    </main>
  );
}
