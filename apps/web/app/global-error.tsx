'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// Catches errors in the root layout itself. Must render its own <html>/<body>,
// and the compiled stylesheet may not be available here — so the design
// language (eyebrow, display headline, ink pill) is reproduced locally.
//
// The colours come from a <style> element rather than style={{}} because they
// need a media query, which inline styles cannot express. `prefers-color-scheme`
// is the only signal available: CSS cannot read the persisted `joblify.ui`
// preference, so someone who chose `light` on a dark OS gets the dark treatment
// here. That mismatch is accepted on a last-resort boundary — a full-white flash
// on an otherwise dark app is the worse outcome.
const CRITICAL_STYLES = `
  :root {
    --ge-bg: #ffffff;
    --ge-fg: #171717;
    --ge-muted: #666666;
    --ge-brand: #4f46e5;
    --ge-ink: #0a0a0a;
    --ge-ink-fg: #ffffff;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --ge-bg: #08080a;
      --ge-fg: #f5f5f5;
      --ge-muted: #a3a3a3;
      --ge-brand: #a5b4fc;
      --ge-ink: #fafafa;
      --ge-ink-fg: #0a0a0a;
      color-scheme: dark;
    }
  }
  .ge-body {
    font-family: system-ui, sans-serif;
    margin: 0;
    padding: 6rem 2rem;
    text-align: center;
    background: var(--ge-bg);
    color: var(--ge-fg);
  }
  .ge-eyebrow {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ge-brand);
  }
  .ge-title {
    margin: 0.75rem 0 0;
    font-size: 2rem;
    font-weight: 900;
    letter-spacing: -0.03em;
  }
  .ge-lede {
    margin: 0.75rem 0 0;
    color: var(--ge-muted);
  }
  .ge-action {
    margin-top: 1.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--ge-ink);
    color: var(--ge-ink-fg);
    border: 0;
    border-radius: 9999px;
    font: inherit;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }
  @media (prefers-reduced-motion: no-preference) {
    .ge-action { transition: opacity 150ms ease; }
  }
  .ge-action:hover { opacity: 0.85; }
  .ge-action:focus-visible {
    outline: 2px solid var(--ge-brand);
    outline-offset: 2px;
  }
`;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <style>{CRITICAL_STYLES}</style>
      </head>
      <body className="ge-body">
        <p className="ge-eyebrow">Error</p>
        <h1 className="ge-title">Something went wrong</h1>
        <p className="ge-lede">The app hit a critical error. Try reloading.</p>
        <button type="button" onClick={reset} className="ge-action">
          Reload
        </button>
      </body>
    </html>
  );
}
