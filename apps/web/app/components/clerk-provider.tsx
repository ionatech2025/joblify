'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ClerkProvider } from '@clerk/clerk-react';
import { useUiStore } from '@/lib/stores/ui';
import { usePrefersDarkScheme } from '@/lib/use-hydrated';
import { resolvesDark } from '@/lib/ui/theme';

// Clerk's widgets (<SignIn>, <SignUp>, <UserButton>) paint from their own
// appearance variables, not from our token layer — so without this they stay
// bright white on a dark page, which is most visible as a glaring card in the
// middle of the split-screen auth layout.
//
// The values are the concrete resolutions of the tokens in globals.css rather
// than `var(--surface)` references: Clerk derives hover/border/disabled shades
// by doing colour math on these, and a var() string is not parseable by that
// code. Keep them in step with the :root / .dark blocks. `fontFamily` is passed
// straight through to CSS, so there a var() reference is fine.
const CLERK_BASE = { borderRadius: '0.75rem', fontFamily: 'var(--font-inter)' } as const;

const CLERK_LIGHT = {
  ...CLERK_BASE,
  colorPrimary: '#714b67',
  colorBackground: '#ffffff',
  colorText: '#171717',
  colorTextSecondary: '#525252',
  colorInputBackground: '#ffffff',
  colorInputText: '#171717',
  colorNeutral: '#000000',
  colorSuccess: '#047857',
  colorWarning: '#92400e',
  colorDanger: '#b91c1c',
} as const;

const CLERK_DARK = {
  ...CLERK_BASE,
  colorPrimary: '#8b5a7d',
  colorBackground: '#121215',
  colorText: '#f5f5f5',
  colorTextSecondary: '#a3a3a3',
  colorInputBackground: '#1a1a1f',
  colorInputText: '#f5f5f5',
  colorNeutral: '#ffffff',
  colorSuccess: '#6ee7b7',
  colorWarning: '#fcd34d',
  colorDanger: '#fca5a5',
} as const;

// Frozen at module scope so the object identity is stable across renders and
// Clerk only re-applies styles when the theme genuinely flips.
const APPEARANCE_LIGHT = { variables: CLERK_LIGHT };
const APPEARANCE_DARK = { variables: CLERK_DARK };

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
  // Not a request read (localStorage + matchMedia), so this stays compatible
  // with the cacheComponents constraint described above.
  const theme = useUiStore((s) => s.theme);
  const prefersDark = usePrefersDarkScheme();
  const isDark = resolvesDark(theme, prefersDark);

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
      // Pinned to an exact clerk-js release. Without this, the SDK resolves
      // the CDN script URL from the major version alone (e.g. ".../clerk-js@5/
      // ...") and the Clerk-hosted CDN 307-redirects that to the concrete
      // latest 5.x build. Chrome's CSP enforcement refuses to follow a
      // redirect for a script whose *original* URL matched a script-src
      // allow-list entry, so with no pin Clerk never loads on the deployed
      // app at all — sign-in/up and every gated page silently fail. Re-verify
      // and re-pin (`curl -I https://<frontend-api>/npm/@clerk/clerk-js@5/
      // dist/clerk.browser.js` and follow the `location` header) whenever
      // @clerk/clerk-react is upgraded.
      clerkJSVersion="5.127.2"
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      routerPush={(to: string) => router.push(to)}
      routerReplace={(to: string) => router.replace(to)}
      appearance={isDark ? APPEARANCE_DARK : APPEARANCE_LIGHT}
    >
      {children}
    </ClerkProvider>
  );
}
