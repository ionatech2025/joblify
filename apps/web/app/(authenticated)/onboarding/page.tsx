import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { completeJobSeekerOnboarding } from '@/app/actions/onboarding';
import { PageHeader } from '@/app/components/ui/ambient';
import { Button, buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'Get started' };

// First stop after sign-up (flowchart: "Company or Job seeker?"). Users who
// already picked a path are routed straight to their dashboard.
export default async function OnboardingPage() {
  const user = await requireUser();

  if (user.userType === 'COMPANY') redirect('/company/jobs');
  if (user.userType === 'ADMIN') redirect('/admin');

  const profile = await db.jobSeekerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (profile) redirect('/jobseeker/applications');

  return (
    <main>
      <PageHeader
        title="Welcome to Joblify"
        subtitle="Tell us what brings you here so we can set up the right workspace."
        width="max-w-3xl"
      />
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6">
        <section className="flex flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-soft">
          <div>
            <h2 className="m-0 text-lg font-semibold text-neutral-900">I&apos;m looking for opportunities</h2>
            <p className="mt-1 mb-0 text-sm text-neutral-600">
              Build a profile, follow companies, apply to jobs, and track your applications. Pick how you want
              companies to see you — you can change this later in your profile.
            </p>
          </div>
          <form action={completeJobSeekerOnboarding} className="mt-auto flex flex-col gap-2">
            <Button type="submit" name="profileType" value="EMPLOYABLE">
              I&apos;m employable — looking for a role
            </Button>
            <Button type="submit" name="profileType" value="VIRTUAL_INTERN" variant="secondary">
              I&apos;m a virtual intern — looking for experience
            </Button>
          </form>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-soft">
          <div>
            <h2 className="m-0 text-lg font-semibold text-neutral-900">I&apos;m hiring</h2>
            <p className="mt-1 mb-0 text-sm text-neutral-600">
              Create a company profile to post jobs, review applicants, and chat with shortlisted candidates and
              virtual interns.
            </p>
          </div>
          <Link href="/employer-setup" className={`${buttonClasses('primary')} mt-auto no-underline`}>
            Set up my company
          </Link>
        </section>
      </div>
    </main>
  );
}
