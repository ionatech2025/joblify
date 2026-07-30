import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { PillNav } from '@/app/(authenticated)/pill-nav';
import { ShellSkeleton } from '@/app/components/shell-skeleton';
import CompanyLoading from './loading';

// The role check is uncached, so under cacheComponents it runs inside Suspense
// (which also covers every child page's dynamic data access). A signed-in user
// who isn't a company yet is sent to /employer-setup to create their profile.
// The fallback paints the company skeleton (sub-nav strip + page blocks)
// instead of a blank body.
export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <ShellSkeleton>
          <CompanyLoading />
        </ShellSkeleton>
      }
    >
      <CompanyShell>{children}</CompanyShell>
    </Suspense>
  );
}

const LINKS = [
  { href: '/company/jobs', label: 'Jobs' },
  { href: '/company/jobs/new', label: 'Post a job' },
  { href: '/company/jobseekers', label: 'Job seekers' },
  { href: '/company/chats', label: 'Chats' },
  { href: '/company/settings', label: 'Company settings' },
];

async function CompanyShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.userType !== 'COMPANY') redirect('/employer-setup');

  return (
    <section>
      <PillNav label="Company" links={LINKS} />
      {children}
    </section>
  );
}
