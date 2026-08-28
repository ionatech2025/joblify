import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { completeJobSeekerOnboarding } from '@/app/actions/onboarding';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { buttonClasses } from '@/app/components/ui/button';
import { ProfileTypeSubmit } from './profile-type-submit';

export const metadata = { title: 'Get started' };

type SearchParams = Promise<{ invitationId?: string }>;

// First stop after sign-up (flowchart: "Company or Job seeker?"). Users who
// already picked a path are routed straight to their dashboard.
//
// This component is deliberately NOT async. The two choice cards are the same
// markup for every visitor, so keeping the page body synchronous lets
// cacheComponents prerender them into the CDN shell — the whole point of PPR,
// and what the page previously threw away by awaiting the session up front
// (every byte of it then sat behind the layout's fallback, so the shell shipped
// 36 skeleton nodes and nothing else). The two things that genuinely read the
// request — the redirect guard and the invitation id — stream into their own
// holes below.
export default function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main>
      <ControlPanel breadcrumb={<Breadcrumb items={[{ label: 'Get started' }]} />} />
      <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-4">
        <Suspense fallback={null}>
          <OnboardingGuard />
        </Suspense>
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
              <Suspense fallback={null}>
                <InvitationField searchParams={searchParams} />
              </Suspense>
              <ProfileTypeSubmit value="EMPLOYABLE">
                I&apos;m employable — looking for a role
              </ProfileTypeSubmit>
              <ProfileTypeSubmit value="VIRTUAL_INTERN" variant="secondary">
                I&apos;m a virtual intern — looking for experience
              </ProfileTypeSubmit>
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

// Renders nothing — its whole job is to bounce accounts that don't belong on
// this page. Session + profile reads, so it streams rather than blocking the
// static cards above it. The middleware already refuses signed-out requests to
// /onboarding, so this is the role gate, not the authentication one.
async function OnboardingGuard() {
  const user = await requireUser();

  if (user.userType === 'COMPANY') redirect('/company/jobs');
  if (user.userType === 'ADMIN') redirect('/admin');

  const profile = await db.jobSeekerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (profile) redirect('/jobseeker/applications');

  return null;
}

// invitationId: set when respondToInvitation sent an ACCEPT here because no
// profile existed yet — carried through the form so completeJobSeekerOnboarding
// can finish that accept instead of losing it. Reading searchParams is request
// data, so it gets its own boundary; the buttons around it stay static.
async function InvitationField({ searchParams }: { searchParams: SearchParams }) {
  const { invitationId } = await searchParams;
  if (!invitationId) return null;
  return <input type="hidden" name="invitationId" value={invitationId} />;
}
