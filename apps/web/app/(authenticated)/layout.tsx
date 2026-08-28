import { Suspense } from 'react';
import { requireUser } from '@/lib/auth';
import { ConsoleShell } from '@/app/components/console/shell';

// ConsoleShell is at this level rather than inside each sub-shell because
// everything under (authenticated) — the jobseeker workspace, onboarding,
// employer setup, account tools — is back-office surface, and the console token
// register is what makes them one product rather than three.
//
// The auth gate reads the session, so under cacheComponents it has to live
// inside a Suspense boundary. It sits *beside* {children} rather than wrapping
// them: wrapping meant every page's markup — including parts that never touched
// the session — was stuck behind the gate's fallback, so no authenticated route
// could put anything real in its prerendered shell. Pages that do read the
// session still suspend on their own and land on their segment's loading.tsx;
// pages that split their static half out (see onboarding/page.tsx) now ship it
// from the CDN.
//
// This is safe because the shell is build-time markup with no user data in it,
// and it is not the authentication check: middleware.ts already refuses
// signed-out requests to every route in this group, and each page and Server
// Action re-checks with requireUser/requireRole. The gate is defence in depth,
// and it still redirects before anything user-specific can stream.
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell>
      <Suspense fallback={null}>
        <Gate />
      </Suspense>
      {children}
    </ConsoleShell>
  );
}

// Renders nothing; exists for the redirect.
async function Gate() {
  await requireUser();
  return null;
}
