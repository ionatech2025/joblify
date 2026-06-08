import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfileForm } from './profile-form';
import { BioCoach } from './bio-coach';

export const metadata = { title: 'My profile' };

export default async function JobseekerProfilePage() {
  const user = await requireRole('JOB_SEEKER');
  const profile = await db.jobSeekerProfile.findUnique({ where: { userId: user.id } });

  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>My profile</h1>
      <p style={{ color: '#666' }}>
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

      <div style={{ marginTop: '2rem' }}>
        <BioCoach currentBio={profile?.bio ?? ''} />
      </div>
    </main>
  );
}
