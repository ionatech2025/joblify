import { Suspense } from 'react';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';

const navLink = 'text-neutral-700 transition-colors hover:text-neutral-900';

// The only part of the header that reads the Clerk session on the server.
// auth() reads request headers (uncached), so it streams inside its own
// Suspense boundary while the header shell and the page around it prerender.
// The wrapper reserves enough width for either signed state and the fallback
// mirrors the signed-out links' footprint, so the stream-in never shifts the
// surrounding nav (no CLS).
export function HeaderAuth() {
  return (
    <div className="flex min-w-36 items-center justify-end gap-6">
      <Suspense fallback={<HeaderAuthFallback />}>
        <HeaderAuthState />
      </Suspense>
    </div>
  );
}

async function HeaderAuthState() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <>
        <Link href="/sign-in" className={navLink}>
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white no-underline transition-colors hover:bg-indigo-700"
        >
          Sign up
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/dashboard" className={navLink}>
        Dashboard
      </Link>
      <UserButton />
    </>
  );
}

// Pulse blocks sized like the signed-out links ("Sign in" text + the "Sign up"
// button), which is what the CDN-cached shell shows before auth streams in.
function HeaderAuthFallback() {
  return (
    <>
      <span aria-hidden="true" className="h-4 w-11 animate-pulse rounded bg-neutral-200" />
      <span aria-hidden="true" className="h-8 w-[4.5rem] animate-pulse rounded-lg bg-neutral-200" />
    </>
  );
}
