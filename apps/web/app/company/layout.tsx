import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { ConsoleShell } from '@/app/components/console/shell';
import { ConsoleNav, type ConsoleNavLink } from '@/app/components/console/nav';
import { ConsolePageSkeleton } from '@/app/components/console/skeleton';

// The role check is uncached, so under cacheComponents it runs inside Suspense
// (which also covers every child page's dynamic data access). A signed-in user
// who isn't a company yet is sent to /employer-setup to create their profile.
export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ConsolePageSkeleton />}>
      <CompanyShell>{children}</CompanyShell>
    </Suspense>
  );
}

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

async function CompanyShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.userType !== 'COMPANY') redirect('/employer-setup');

  return (
    <ConsoleShell>
      <ConsoleNav module="Recruitment" moduleHref="/company/jobs" links={LINKS} />
      {children}
    </ConsoleShell>
  );
}
