import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

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

async function CompanyShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.userType !== 'COMPANY') redirect('/employer-setup');

  return (
    <section>
      <nav
        style={{
          display: 'flex',
          gap: '1.25rem',
          padding: '0.75rem 2rem',
          borderBottom: '1px solid #eee',
          fontSize: '0.95rem',
        }}
      >
        <Link href="/company/jobs" style={{ color: '#111', textDecoration: 'none' }}>
          Jobs
        </Link>
        <Link href="/company/jobs/new" style={{ color: '#111', textDecoration: 'none' }}>
          Post a job
        </Link>
        <Link href="/company/settings" style={{ color: '#111', textDecoration: 'none' }}>
          Company settings
        </Link>
      </nav>
      {children}
    </section>
  );
}
