'use client';

import { useEffect } from 'react';
import { useUiStore } from '@/lib/stores/ui';
import { useHydrated } from '@/lib/use-hydrated';

// Slim self-hosted consent banner. Two choices — "Necessary only" and
// "Accept all" (necessary + analytics). The choice is written to localStorage,
// to a `joblify_consent` cookie (so <AnalyticsGate> and the server can read it),
// and mirrored to User.consentJson via /api/v1/consent when signed in.
// <AnalyticsGate> in app/layout.tsx only mounts Analytics/SpeedInsights when the
// cookie is 'all', so nothing analytics-related loads before consent.

type ConsentChoice = 'all' | 'necessary' | null;

// localStorage throws rather than returning null in some privacy modes, and
// this one is read during render, where a throw would take the page with it.
function storedConsent(): string | null {
  try {
    return localStorage.getItem('joblify.consent');
  } catch {
    return null;
  }
}

export function CookieBanner() {
  const hydrated = useHydrated();
  const isOpen = useUiStore((s) => s.isCookieBannerOpen);
  const setOpen = useUiStore((s) => s.setCookieBannerOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (storedConsent()) setOpen(false);
  }, [setOpen]);

  function decide(choice: ConsentChoice) {
    const value = choice ?? 'necessary';
    localStorage.setItem('joblify.consent', value);
    // Cookie so <AnalyticsGate> and the server can read the choice.
    document.cookie = `joblify_consent=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    // Let the analytics gate re-evaluate without a reload.
    window.dispatchEvent(new Event('joblify:consent'));
    // Best-effort compliance mirror — no-op when signed out.
    void fetch('/api/v1/consent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ analytics: value === 'all' }),
    }).catch(() => {});
    setOpen(false);
  }

  // isCookieBannerOpen is an ephemeral store slice that starts true, so the
  // banner used to be baked into the prerendered shell and shown to everyone —
  // including people who answered it months ago — until the effect above closed
  // it again. That is a visible flash on every cold load, and onboarding is
  // four cold loads. Gating on hydration keeps it out of the shell entirely.
  //
  // The stored value is also read synchronously here rather than trusting the
  // effect to have landed first: one frame of banner is exactly what this
  // removes.
  if (!hydrated || !isOpen || storedConsent()) return null;

  return (
    <aside
      // No role="dialog" here: <aside>'s implicit role is `complementary`, and
      // ARIA forbids overriding it with `dialog` (aria-allowed-role) — this
      // banner doesn't trap focus or block the page like a real dialog does,
      // so `complementary` is also the more accurate role.
      aria-label="Cookie preferences"
      className="rounded-card bg-band text-band-fg shadow-raised fixed inset-x-4 bottom-4 z-[1000] mx-auto flex max-w-3xl flex-col gap-3 px-5 py-4"
    >
      <p className="m-0 text-sm">
        Joblify uses essential cookies to keep you signed in. With your consent, we also use
        analytics to understand how the site is used.{' '}
        <a href="/legal/privacy" className="text-band-fg underline">
          Privacy policy
        </a>
      </p>
      {/* Pills, matching every other CTA in the app. These can't use <Button>:
          its variants resolve against the page surface, and this banner sits on
          the always-dark band regardless of theme. */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => decide('all')}
          className="bg-band-fg text-band focus-visible:ring-band-fg focus-visible:ring-offset-band rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Accept all
        </button>
        <button
          onClick={() => decide('necessary')}
          className="border-band-fg/30 text-band-fg hover:bg-band-fg/10 focus-visible:ring-band-fg focus-visible:ring-offset-band rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Necessary only
        </button>
      </div>
    </aside>
  );
}
