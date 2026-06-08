'use client';

import { useEffect } from 'react';
import { useUiStore } from '@/lib/stores/ui';

// Slim self-hosted consent banner. Two choices — "Necessary only" and
// "Accept all" (necessary + analytics). The choice is written to localStorage,
// to a `joblify_consent` cookie (so <AnalyticsGate> and the server can read it),
// and mirrored to User.consentJson via /api/v1/consent when signed in.
// <AnalyticsGate> in app/layout.tsx only mounts Analytics/SpeedInsights when the
// cookie is 'all', so nothing analytics-related loads before consent.

type ConsentChoice = 'all' | 'necessary' | null;

export function CookieBanner() {
  const isOpen = useUiStore((s) => s.isCookieBannerOpen);
  const setOpen = useUiStore((s) => s.setCookieBannerOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('joblify.consent')) setOpen(false);
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

  if (!isOpen) return null;

  return (
    <aside
      role="dialog"
      aria-label="Cookie preferences"
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 720,
        margin: '0 auto',
        padding: '1rem 1.25rem',
        background: '#111',
        color: '#fff',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.95rem' }}>
        Joblify uses essential cookies to keep you signed in. With your consent, we also use
        analytics to understand how the site is used.{' '}
        <a href="/legal/privacy" style={{ color: '#9bd8ff' }}>
          Privacy policy
        </a>
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => decide('all')} style={btn('primary')}>
          Accept all
        </button>
        <button onClick={() => decide('necessary')} style={btn('secondary')}>
          Necessary only
        </button>
      </div>
    </aside>
  );
}

function btn(variant: 'primary' | 'secondary'): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '0.55rem 1rem',
    borderRadius: 6,
    fontWeight: 600,
    border: 0,
    cursor: 'pointer',
  };
  return variant === 'primary'
    ? { ...base, background: '#fff', color: '#111' }
    : { ...base, background: 'transparent', color: '#fff', border: '1px solid #555' };
}
