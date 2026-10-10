// Browser Sentry, kept out of the JavaScript every route downloads.
//
// `@sentry/nextjs` is roughly 65 KB gzip of client code. It used to be imported
// statically by instrumentation-client.ts and by both error boundaries, so it
// sat in the chunk set of every page on the site — including on a deployment
// with no DSN, where init() is never called and the bytes did nothing at all.
//
// Everything now goes through this module, which imports the SDK dynamically:
//
//   - no DSN at build time  → `loadSentry()` returns before it reaches the
//     import, so the SDK is never requested (it is not in any chunk a page
//     loads, and the first-load budget in scripts/check-bundle-budget.ts
//     counts none of it);
//   - DSN present           → the SDK is its own async chunk, fetched after the
//     page has loaded (see instrumentation-client.ts), off the path hydration
//     and first interaction depend on.
//
// What deferring costs: errors thrown before the SDK arrives are buffered by
// instrumentation-client.ts and replayed once it has, so they are not lost —
// they just carry no breadcrumbs from before init.

import type * as SentryNamespace from '@sentry/nextjs';

type SentryModule = typeof SentryNamespace;

// Inlined at build time (NEXT_PUBLIC_*), which is what lets the dead branch go.
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

/** Whether this build reports to Sentry from the browser. */
export const SENTRY_ENABLED = Boolean(DSN);

let loading: Promise<SentryModule | null> | null = null;
let loaded: SentryModule | null = null;
const whenLoaded: Array<(sentry: SentryModule) => void> = [];

// Bounds the queue below. Telemetry should never be able to grow without limit
// while the SDK chunk is on its way.
const MAX_QUEUED = 50;

/**
 * Loads and initialises the SDK — once, however many callers there are.
 * Resolves to `null` when Sentry is not configured or the chunk fails to load.
 */
export function loadSentry(): Promise<SentryModule | null> {
  if (!DSN) return Promise.resolve(null);
  loading ??= import('@sentry/nextjs')
    .then((sentry) => {
      sentry.init({
        dsn: DSN,
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
      });
      loaded = sentry;
      for (const callback of whenLoaded.splice(0)) callback(sentry);
      return sentry;
    })
    .catch(() => null);
  return loading;
}

/** The SDK if it has already been loaded, without being the reason it loads. */
export function loadedSentry(): SentryModule | null {
  return loaded;
}

/**
 * Runs `callback` with the SDK once it is loaded — immediately if it already
 * is — without being the reason it loads. For telemetry that should ride along
 * (web vitals), as opposed to errors, which are a reason to load it.
 */
export function withSentry(callback: (sentry: SentryModule) => void): void {
  if (!DSN) return;
  if (loaded) callback(loaded);
  else if (whenLoaded.length < MAX_QUEUED) whenLoaded.push(callback);
}

/**
 * For error boundaries. An error is reason enough to load the SDK, so this
 * does, and reports once it is up. Never throws.
 */
export function reportClientError(error: unknown): void {
  if (!DSN) return;
  void loadSentry().then((sentry) => sentry?.captureException(error));
}
