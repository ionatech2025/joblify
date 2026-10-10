import { Suspense } from 'react';
import Link from 'next/link';
import { preconnect } from 'react-dom';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { clerkFrontendOrigin } from '@/lib/clerk-origin';
import { AuthHint } from './auth-hint';
import { ClerkSlot } from './clerk-slot';
import { Skeleton } from '@/app/components/ui/skeleton';

const navLink = 'text-fg-muted transition-colors hover:text-fg';

// The parts of the header that read the Clerk session on the server. auth()
// reads request headers (uncached), so each streams inside its own Suspense
// boundary while the header shell and the page around it prerender. The
// wrapper reserves enough width for either signed state and the fallback
// mirrors the signed-out links' footprint, so the stream-in never shifts the
// surrounding nav (no CLS).
//
// These are also what decide whether the page loads Clerk's browser SDK at
// all: a signed-out visitor gets plain links and nothing else; only a
// signed-in one gets a <UserButton>, which needs it (see clerk-host.tsx).
export function HeaderAuth() {
  return (
    <div className="flex min-w-36 items-center justify-end gap-6">
      <Suspense fallback={<HeaderAuthFallback />}>
        <HeaderAuthState />
      </Suspense>
    </div>
  );
}

/**
 * The signed-in user's avatar menu in the mobile header, which has its own
 * slot (the desktop nav is `hidden` below `sm`). Renders nothing when signed
 * out, so a signed-out phone pays for no Clerk code.
 */
export function HeaderUserMobile() {
  return (
    <Suspense fallback={null}>
      <HeaderUserMobileState />
    </Suspense>
  );
}

// The same size as Clerk's avatar, so the swap when clerk-js arrives moves
// nothing.
function UserButtonSlot() {
  return (
    <ClerkSlot fallback={<UserButtonPlaceholder />}>
      <UserButton />
    </ClerkSlot>
  );
}

async function HeaderAuthState() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <>
        <AuthHint userId={null} />
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

  // This visitor is about to load clerk-js for the avatar menu; open the
  // connection to its origin now rather than when the script is requested.
  const origin = clerkFrontendOrigin();
  if (origin) preconnect(origin, { crossOrigin: 'anonymous' });

  return (
    <>
      <AuthHint userId={userId} />
      <Link href="/dashboard" className={navLink}>
        Dashboard
      </Link>
      <UserButtonSlot />
    </>
  );
}

async function HeaderUserMobileState() {
  const { userId } = await auth();
  return userId ? <UserButtonSlot /> : null;
}

function UserButtonPlaceholder() {
  return <Skeleton className="size-7 shrink-0" />;
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
