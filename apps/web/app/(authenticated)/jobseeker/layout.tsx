import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { JobseekerConsoleNav } from './jobseeker-console-nav';

// Jobseeker workspace module menu. Auth (signed in at all) is already
// enforced by the (authenticated) layout, which also establishes the console
// token register and the Suspense boundary this runs inside — but not role.
// A COMPANY or ADMIN account can land on any /jobseeker/* route (e.g. via the
// command palette, which lists every role's routes unconditionally) and,
// without this, every page here calls requireRole('JOB_SEEKER') itself and
// throws, landing on the generic error page instead of their own workspace.
export default async function JobseekerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.userType === 'COMPANY') redirect('/company/jobs');
  if (user.userType === 'ADMIN') redirect('/admin');

  return (
    <>
      <JobseekerConsoleNav />
      {children}
    </>
  );
}
