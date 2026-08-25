import { Suspense } from 'react';
import { requireUser } from '@/lib/auth';
import { ConsoleShell } from '@/app/components/console/shell';
import { ConsolePageSkeleton } from '@/app/components/console/skeleton';

// The auth check is uncached (reads the session), so under cacheComponents it
// must live inside a Suspense boundary. Wrapping the gate here also covers every
// child page's own dynamic data access.
//
// ConsoleShell is at this level rather than inside each sub-shell because
// everything under (authenticated) — the jobseeker workspace, onboarding,
// employer setup, account tools — is back-office surface, and the console token
// register is what makes them one product rather than three.
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell>
      <Suspense fallback={<ConsolePageSkeleton />}>
        <Gate>{children}</Gate>
      </Suspense>
    </ConsoleShell>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
