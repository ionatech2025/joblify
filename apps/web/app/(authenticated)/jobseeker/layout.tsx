import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { ConsoleNavSkeleton } from '@/app/components/console/skeleton';
import { JobseekerConsoleNav } from './jobseeker-console-nav';

// Jobseeker workspace module menu. Authentication (signed in at all) is already
// enforced by middleware and re-checked by the (authenticated) layout's gate;
// this is the role check. A COMPANY or ADMIN account can land on any
// /jobseeker/* route (e.g. via the command palette, which lists every role's
// routes unconditionally) and, without this, every page here calls
// requireRole('JOB_SEEKER') itself and throws, landing on the generic error
// page instead of their own workspace.
//
// The gate is a sibling of the nav rather than wrapping it, and this component
// is not async, for the same reason as the parent layout: an async layout has
// no Suspense boundary of its own — loading.tsx wraps a layout's children, not
// the layout — so awaiting the session here forced the whole workspace,
// including the module menu, out of every prerendered shell.
export default function JobseekerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <RoleGate />
      </Suspense>
      {/* The nav marks the active tab from usePathname(), which is request data
          — so it gets a hole of its own, at the bar's exact height, rather than
          pulling the page around it out of the shell with it. */}
      <Suspense fallback={<ConsoleNavSkeleton />}>
        <JobseekerConsoleNav />
      </Suspense>
      {children}
    </>
  );
}

// Renders nothing; exists for the redirect.
async function RoleGate() {
  const user = await requireUser();
  if (user.userType === 'COMPANY') redirect('/company/jobs');
  if (user.userType === 'ADMIN') redirect('/admin');
  return null;
}
