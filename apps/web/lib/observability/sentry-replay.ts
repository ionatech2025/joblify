import { addIntegration, replayIntegration } from '@sentry/nextjs';

// Isolated so `replayIntegration` is referenced from exactly one place, and
// that place is only ever reached through a dynamic import. Nothing in the
// synchronous boot graph names it, so the DOM recorder (~50 KB gzip) lands in
// its own async chunk instead of the shared one every route downloads.
//
// Deliberately not Sentry.lazyLoadIntegration(): that fetches the recorder from
// browser.sentry-cdn.com, which the CSP in next.config.ts does not allow as a
// script source. This keeps it self-hosted under `script-src 'self'`.
export function enableSessionReplay(): void {
  addIntegration(replayIntegration({ maskAllText: true, blockAllMedia: true }));
}
