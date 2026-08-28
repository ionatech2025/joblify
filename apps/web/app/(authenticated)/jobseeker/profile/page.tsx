import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfileForm } from './profile-form';
import { BioCoach } from './bio-coach';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

export const metadata = { title: 'My profile' };

// The skill vocabulary is reference data: nothing in the app writes to it, only
// prisma/seed.ts does. It was being re-read in full and re-serialised into the
// client payload on every render of this page — which is the page onboarding
// drops every new job seeker on. Cached like the marketing queries in
// (marketing)/page.tsx; a deploy that reseeds also rebuilds the cache.
async function getSkillOptions(): Promise<Array<{ slug: string; label: string }>> {
  'use cache';
  const { cacheLife } = await import('next/cache');
  cacheLife('days');
  return db.skill.findMany({ select: { slug: true, label: true }, orderBy: { label: 'asc' } });
}

export default async function JobseekerProfilePage() {
  const user = await requireRole('JOB_SEEKER');
  const [profile, allSkills] = await Promise.all([
    db.jobSeekerProfile.findUnique({
      where: { userId: user.id },
      include: { skills: { select: { skill: { select: { slug: true } } } } },
    }),
    getSkillOptions(),
  ]);

  return (
    <main>
      <ControlPanel breadcrumb={<Breadcrumb items={[{ label: 'Profile' }]} />} />
      <div className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-4">
        <p className="text-fg-muted mb-2 text-[13px]">
          These fields show up to recruiters when you apply. Keep your headline and skills current.
        </p>
        <ProfileForm
          allSkills={allSkills}
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
            education: profile?.education ?? '',
            certifications: profile?.certifications ?? '',
            portfolioUrl: profile?.portfolioUrl ?? '',
            skillSlugs: profile?.skills.map((s) => s.skill.slug) ?? [],
          }}
        />

        <div className="mt-8">
          <BioCoach currentBio={profile?.bio ?? ''} />
        </div>
      </div>
    </main>
  );
}
