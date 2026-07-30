import { Suspense } from 'react';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { Skeleton } from '@/app/components/ui/skeleton';

const navLink = 'text-fg-muted transition-colors hover:text-fg';

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
          className="rounded-full bg-ink px-4 py-1.5 font-semibold text-ink-fg no-underline transition-colors hover:bg-ink-hover"
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
      <Skeleton className="h-4 w-11 rounded" />
      <Skeleton className="h-8 w-[4.75rem]" />
    </>
  );
}
