import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ConsoleShell } from '@/app/components/console/shell';
import { ConsoleNav, type ConsoleNavLink } from '@/app/components/console/nav';
import { ConsoleNavSkeleton } from '@/app/components/console/skeleton';

// Module menu for the employer console. "Post a job" is deliberately NOT here
// any more: a create action belongs on the control panel of the list it creates
// into, not in the section menu. Having it here also forced pill-nav's
// longest-prefix hack, since /company/jobs/new would otherwise light "Jobs".
const LINKS: ConsoleNavLink[] = [
  { href: '/company/jobs', label: 'Jobs', icon: 'Briefcase' },
  { href: '/company/jobseekers', label: 'Talent', icon: 'Users' },
  { href: '/company/chats', label: 'Chats', icon: 'MessagesSquare' },
  { href: '/company/settings', label: 'Settings', icon: 'Settings' },
];

// The role check is a SIBLING of children, and this component is not async.
// An async layout has no Suspense boundary of its own — loading.tsx wraps a
// layout's *children*, not the layout — which is why the await has to move into
// an island instead of being awaited here.
export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell>
      <Suspense fallback={null}>
        <RoleGate />
      </Suspense>
      <Suspense fallback={<ConsoleNavSkeleton />}>
        <ConsoleNav module="Recruitment" moduleHref="/company/jobs" links={LINKS} />
      </Suspense>
      {children}
    </ConsoleShell>
  );
}

// Renders nothing; exists for the redirect. A signed-in user who isn't a
// verified company yet is sent to /employer-setup to create their profile or wait for verification.
async function RoleGate() {
  const user = await requireUser();
  if (user.userType !== 'COMPANY') redirect('/employer-setup');
  const profile = await db.companyProfile.findUnique({
    where: { userId: user.id },
    select: { verificationStatus: true },
  });
  if (!profile || profile.verificationStatus !== 'VERIFIED') {
    redirect('/employer-setup?verification=pending');
  }
  return null;
}
