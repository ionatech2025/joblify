import { Suspense } from 'react';
import { requireUser } from '@/lib/auth';

// The auth check is uncached (reads the session), so under cacheComponents it
// must live inside a Suspense boundary. Wrapping the gate here also covers every
// child page's own dynamic data access.
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <Suspense fallback={null}>
        <Gate>{children}</Gate>
      </Suspense>
    </section>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
