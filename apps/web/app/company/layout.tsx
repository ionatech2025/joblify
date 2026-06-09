import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Container } from '@/app/components/ui/container';

// The role check is uncached, so under cacheComponents it runs inside Suspense
// (which also covers every child page's dynamic data access). A signed-in user
// who isn't a company yet is sent to /employer-setup to create their profile.
export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CompanyShell>{children}</CompanyShell>
    </Suspense>
  );
}

const link = 'text-sm text-neutral-700 transition-colors hover:text-neutral-900';

async function CompanyShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.userType !== 'COMPANY') redirect('/employer-setup');

  return (
    <section>
      <nav className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50">
        <Container className="flex flex-wrap gap-x-5 gap-y-2 py-3">
          <Link href="/company/jobs" className={link}>
            Jobs
          </Link>
          <Link href="/company/jobs/new" className={link}>
            Post a job
          </Link>
          <Link href="/company/settings" className={link}>
            Company settings
          </Link>
        </Container>
      </nav>
      {children}
    </section>
  );
}
