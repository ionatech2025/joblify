import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { completeJobSeekerOnboarding } from '@/app/actions/onboarding';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { Button, buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'Get started' };

type SearchParams = Promise<{ invitationId?: string }>;

// First stop after sign-up (flowchart: "Company or Job seeker?"). Users who
// already picked a path are routed straight to their dashboard.
//
// invitationId: set when respondToInvitation sent an ACCEPT here because no
// profile existed yet — carried through the form below so
// completeJobSeekerOnboarding can finish that accept instead of losing it.
export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const { invitationId } = await searchParams;
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
      <ControlPanel breadcrumb={<Breadcrumb items={[{ label: 'Get started' }]} />} />
      <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-4">
        <p className="text-fg-muted mb-2 text-[13px]">
          Tell us what brings you here so we can set up the right workspace.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-soft">
            <div>
              <h2 className="m-0 text-lg font-semibold text-fg">
                I&apos;m looking for opportunities
              </h2>
              <p className="mt-1 mb-0 text-sm text-fg-muted">
                Build a profile, follow companies, apply to jobs, and track your applications. Pick
                how you want companies to see you — you can change this later in your profile.
              </p>
            </div>
            <form action={completeJobSeekerOnboarding} className="mt-auto flex flex-col gap-2">
              {invitationId && <input type="hidden" name="invitationId" value={invitationId} />}
              <Button type="submit" name="profileType" value="EMPLOYABLE">
                I&apos;m employable — looking for a role
              </Button>
              <Button type="submit" name="profileType" value="VIRTUAL_INTERN" variant="secondary">
                I&apos;m a virtual intern — looking for experience
              </Button>
            </form>
          </section>

          <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-soft">
            <div>
              <h2 className="m-0 text-lg font-semibold text-fg">I&apos;m hiring</h2>
              <p className="mt-1 mb-0 text-sm text-fg-muted">
                Create a company profile to post jobs, review applicants, and chat with shortlisted
                candidates and virtual interns.
              </p>
            </div>
            <Link
              href="/employer-setup"
              className={`${buttonClasses('primary')} mt-auto no-underline`}
            >
              Set up my company
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
