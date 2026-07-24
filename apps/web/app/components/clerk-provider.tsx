'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ClerkProvider } from '@clerk/clerk-react';

// Root Clerk context, built directly on @clerk/clerk-react — the library
// @clerk/nextjs re-exports every component and hook from, so <SignedIn>,
// <UserButton>, <SignIn> etc. all consume this provider's context.
//
// Why not @clerk/nextjs's own <ClerkProvider>: in v6 its router glue calls
// usePathname() during render (useAwaitablePush/Replace → useInternalNavFun),
// and under cacheComponents the pathname is uncached request data on any
// route with runtime params — so the provider, and with it the entire tree it
// wraps, would be forced into a single dynamic hole (the pre-#38 state where
// every CDN shell was empty). Clerk v7 fixed this by dropping the pathname
// read; until that upgrade, this wrapper recreates the v6 Next glue minus the
// pathname read:
//   - publishable key + URLs come from inlined NEXT_PUBLIC_* envs,
//   - Clerk's components navigate through the App Router (routerPush/Replace),
//   - server-rendered auth state (header island, gated layouts) refreshes
//     after sign-in/out — the same __unstable__onAfterSetActive hook
//     @clerk/nextjs wires to router.refresh().
export function ClerkClientProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // clerk-js invokes this after setActive (sign-in, sign-out, session
    // switch); refreshing re-renders server components with the new session.
    const w = window as Window & { __unstable__onAfterSetActive?: () => void };
    w.__unstable__onAfterSetActive = () => router.refresh();
    return () => {
      w.__unstable__onAfterSetActive = undefined;
    };
  }, [router]);

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      routerPush={(to: string) => router.push(to)}
      routerReplace={(to: string) => router.replace(to)}
      // colorPrimary matches the app's indigo accent so Clerk's widgets
      // (sign-in/up card, UserButton) render on-palette.
      appearance={{ variables: { colorPrimary: '#4f46e5' } }}
    >
      {children}
    </ClerkProvider>
  );
}
