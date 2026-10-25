import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfileForm } from './profile-form';
import { BioCoach } from './bio-coach';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { buttonClasses } from '@/app/components/ui/button';

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
      <ConsoleWidth className="max-w-5xl py-3">
        <ProfileForm
          allSkills={allSkills}
          initial={{
            profileType: profile?.profileType ?? 'EMPLOYABLE',
            headline: profile?.headline ?? '',
            bio: profile?.bio ?? '',
            yearsExperience: profile?.yearsExperience ?? null,
            location: profile?.location ?? '',
            phone: user.phone ?? '',
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

        <div className="mt-4">
          <BioCoach currentBio={profile?.bio ?? ''} />
        </div>

        <section
          aria-label="Account and data privacy"
          className="o-sheet mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
        >
          <div className="min-w-0">
            <h2 className="text-fg text-[13px] font-semibold">Data &amp; account privacy</h2>
            <p className="text-fg-muted text-[12px]">
              Download a full copy of your personal data (GDPR Article 15) or permanently close your
              account.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/account/export"
              className={`${buttonClasses('secondary', 'sm')} no-underline`}
            >
              Export my data
            </Link>
            <Link
              href="/account/delete"
              className={`${buttonClasses('danger', 'sm')} no-underline`}
            >
              Delete account
            </Link>
          </div>
        </section>
      </ConsoleWidth>
    </main>
  );
}
