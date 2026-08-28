import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
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
//
// It used to be `<Suspense><CompanyShell>{children}</CompanyShell></Suspense>`
// with an async CompanyShell that awaited requireUser(). That put the await
// inside the boundary and above the children, so nothing under /company had a
// static ancestor: all eight routes prerendered a 36-node skeleton with no
// console chrome in it at all — "Recruitment" and "Talent" appeared zero times
// in the built HTML. The same shape was fixed in (authenticated)/layout.tsx and
// jobseeker/layout.tsx; /company was outside that pass and kept the old one.
//
// An async layout has no Suspense boundary of its own — loading.tsx wraps a
// layout's *children*, not the layout — which is why the await has to move into
// an island instead of being awaited here.
//
// The nav gets a boundary of its own, at the bar's exact height. Its links are
// a static list — unlike the jobseeker menu there is no unread-count query
// behind them — but ConsoleNav marks the active tab from usePathname(), which
// is request data, and on the two dynamic routes here (/company/applicants/
// [jobId], /company/jobs/[id]/edit) prerendering it unguarded fails the build
// with "Uncached data was accessed outside of <Suspense>". A hole the size of
// the bar is the cost; pulling every page around it out of the shell is not.
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
// company yet is sent to /employer-setup to create their profile.
async function RoleGate() {
  const user = await requireUser();
  if (user.userType !== 'COMPANY') redirect('/employer-setup');
  return null;
}
