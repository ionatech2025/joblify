import { Suspense } from 'react';
import { requireUser } from '@/lib/auth';
import { ShellSkeleton } from '@/app/components/shell-skeleton';
import AuthenticatedLoading from './loading';

// The auth check is uncached (reads the session), so under cacheComponents it
// must live inside a Suspense boundary. Wrapping the gate here also covers every
// child page's own dynamic data access. The fallback paints the dashboard
// skeleton (sub-nav strip + page blocks) instead of a blank body.
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <Suspense
        fallback={
          <ShellSkeleton>
            <AuthenticatedLoading />
          </ShellSkeleton>
        }
      >
        <Gate>{children}</Gate>
      </Suspense>
    </section>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
