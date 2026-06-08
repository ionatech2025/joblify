import { Suspense } from 'react';
import { requireRole } from '@/lib/auth';

// Defense-in-depth: middleware already enforces the role, but the layout also
// refuses entry if that check is bypassed. The check is uncached, so under
// cacheComponents it runs inside a Suspense boundary — which also covers every
// child page's own dynamic data access.
export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <Suspense fallback={null}>
        <Gate>{children}</Gate>
      </Suspense>
    </section>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireRole('COMPANY');
  return <>{children}</>;
}
