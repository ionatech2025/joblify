import { Suspense } from 'react';
import { requireUser } from '@/lib/auth';
import AuthenticatedLoading from './loading';

// The auth check is uncached (reads the session), so under cacheComponents it
// must live inside a Suspense boundary. Wrapping the gate here also covers every
// child page's own dynamic data access. The fallback paints the dashboard
// skeleton (sub-nav strip + page blocks) instead of a blank body.
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <Suspense fallback={<AuthenticatedShellSkeleton />}>
        <Gate>{children}</Gate>
      </Suspense>
    </section>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}

// While the gate resolves, the children (and any sub-nav they render, like the
// jobseeker layout's) are still pending — so this reserves a nav strip of
// link-width bars on top of the standard page skeleton.
function AuthenticatedShellSkeleton() {
  return (
    <>
      <div className="border-b border-indigo-100 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="my-0.5 h-4 w-20 animate-pulse rounded bg-neutral-200" />
          ))}
        </div>
      </div>
      <AuthenticatedLoading />
    </>
  );
}
