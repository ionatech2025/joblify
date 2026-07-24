import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Container } from '@/app/components/ui/container';
import { PillNav } from '@/app/(authenticated)/pill-nav';
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
// reserves a nav strip of pill placeholders on top of the standard page skeleton.
function CompanyShellSkeleton() {
  return (
    <section>
      <div className="border-b border-indigo-100 bg-white/70 backdrop-blur">
        <Container className="flex flex-wrap gap-x-1.5 gap-y-1.5 py-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="h-8 w-24 animate-pulse rounded-full bg-neutral-200" />
          ))}
        </Container>
      </div>
      <CompanyLoading />
    </section>
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
