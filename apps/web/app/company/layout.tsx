import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Container } from '@/app/components/ui/container';
import CompanyLoading from './loading';

// The role check is uncached, so under cacheComponents it runs inside Suspense
// (which also covers every child page's dynamic data access). A signed-in user
// who isn't a company yet is sent to /employer-setup to create their profile.
// The fallback paints the company skeleton (sub-nav strip + page blocks)
// instead of a blank body.
export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<CompanyShellSkeleton />}>
      <CompanyShell>{children}</CompanyShell>
    </Suspense>
  );
}

// While the role check resolves, the real sub-nav is still pending — so this
// reserves a nav strip of link-width bars on top of the standard page skeleton.
function CompanyShellSkeleton() {
  return (
    <section>
      <div className="border-b border-indigo-100 bg-white/70 backdrop-blur">
        <Container className="flex flex-wrap gap-x-5 gap-y-2 py-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="my-0.5 h-4 w-20 animate-pulse rounded bg-neutral-200" />
          ))}
        </Container>
      </div>
      <CompanyLoading />
    </section>
  );
}

const link = 'text-sm text-neutral-700 transition-colors hover:text-neutral-900';

async function CompanyShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.userType !== 'COMPANY') redirect('/employer-setup');

  return (
    <section>
      <nav className="border-b border-indigo-100 bg-white/70 backdrop-blur">
        <Container className="flex flex-wrap gap-x-5 gap-y-2 py-3">
          <Link href="/company/jobs" className={link}>
            Jobs
          </Link>
          <Link href="/company/jobs/new" className={link}>
            Post a job
          </Link>
          <Link href="/company/jobseekers" className={link}>
            Job seekers
          </Link>
          <Link href="/company/chats" className={link}>
            Chats
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
