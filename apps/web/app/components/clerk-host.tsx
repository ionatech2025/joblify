'use client';

import dynamic from 'next/dynamic';
import { useClerkSlots } from '@/lib/stores/clerk-slots';

// Clerk's browser SDK, on demand.
//
// Before this, one <ClerkProvider> wrapped the whole tree, so every page —
// including the legal pages and the job board, for visitors who were never
// going to sign in — downloaded and ran Clerk. Measured on the live site, a
// signed-out visit to a static page spent 305 KB (38 % of everything it
// transferred) and eight requests on it, ran ~0.9 s of main-thread time at 4x
// CPU, and set two third-party cookies (Best Practices 77) — to render nothing:
// the header's auth links are server-rendered from auth(), and no widget is on
// those pages.
//
// What needs the Clerk context is a short list, and each item renders through a
// <ClerkSlot>: the header's UserButton (signed-in visitors only — the server
// decides, from the session cookie) and the <SignIn>/<SignUp> cards. A slot
// registers itself here; the first registration loads the provider and the
// slots are portalled into it. One provider, however many slots, and it is not
// created at all on a page with none.
//
// A host with portals rather than a provider that wraps the tree because a
// wrapper cannot appear later without remounting everything beneath it, and
// because two providers are an error in @clerk/clerk-react. The portals keep
// each widget in its own place in the DOM and share one context.
//
// The provider is still the hand-built one in clerk-provider.tsx (see its
// header for why it is not @clerk/nextjs's own).
const ClerkRuntime = dynamic(() => import('./clerk-runtime'), { ssr: false });

export function ClerkHost() {
  const started = useClerkSlots((s) => s.started);
  return started ? <ClerkRuntime /> : null;
}
