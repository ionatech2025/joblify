import { initBotId } from 'botid/client/core';
import { SENTRY_ENABLED, loadSentry, loadedSentry } from './lib/observability/sentry-client';

// BotID's client half. `checkBotId()` in app/actions/apply.ts has been asking
// for a verdict since the apply funnel shipped, but nothing ever served the
// challenge script it classifies on — that needs BOTH `withBotId()` in
// next.config.ts (which installs the proxy rewrites) and this call (which
// requests the script for the listed paths). A missing integration throws
// nothing and logs nothing, so the funnel read as protected while the verdict
// was formed on no signal at all.
//
// Server Actions POST to the URL of the page hosting them, so the path here is
// the apply page's route, not an API endpoint.
initBotId({
  protect: [{ path: '/jobs/*/apply', method: 'POST' }],
});

// Browser Sentry — errors + masked Session Replay. DSN-gated like the server
// side; uses the public DSN so it can ship in the client bundle. Next.js loads
// this file automatically on the client (replaces sentry.client.config.ts).
//
// The SDK itself is NOT imported here (see lib/observability/sentry-client.ts
// for the why): this file only decides *when* it loads, and holds on to
// anything that goes wrong in the meantime.
if (SENTRY_ENABLED && typeof window !== 'undefined') {
  // Errors that fire before the SDK is up. Sentry's own global handlers take
  // over at init(); these cover the gap, and are replayed into it. Bounded —
  // a page stuck in an error loop must not grow memory while it waits.
  const early: unknown[] = [];
  const onError = (e: ErrorEvent) => {
    if (early.length < 20) early.push(e.error ?? e.message);
  };
  const onRejection = (e: PromiseRejectionEvent) => {
    if (early.length < 20) early.push(e.reason);
  };
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  const start = () => {
    void loadSentry().then((sentry) => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      if (!sentry) return;
      for (const error of early.splice(0)) sentry.captureException(error);
    });
  };

  // After the page has loaded and the main thread has a gap — the SDK's parse
  // and init are real work, and nothing a visitor is waiting on needs it. The
  // timeout bounds how long a permanently busy thread can put it off.
  // Checked by typeof rather than `in`: Window declares requestIdleCallback, so
  // an `in` guard narrows the else branch to never and the fallback stops
  // compiling — while Safari still only shipped it in 18.4.
  const whenIdle = (fn: () => void, timeout: number) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(fn, { timeout });
    } else {
      window.setTimeout(fn, 1500);
    }
  };
  const scheduleStart = () => whenIdle(start, 5000);
  if (document.readyState === 'complete') scheduleStart();
  else window.addEventListener('load', scheduleStart, { once: true });

  // Replay is added after init rather than passed to init(). With
  // replaysSessionSampleRate: 0 the recorder only ever uploads on an error, but
  // as a static integration it still rode along in the chunk shared by every
  // route — including /sign-up and /onboarding, where it is pure dead weight on
  // the critical path. It still has to be armed *before* an error to hold the
  // rolling buffer, so it loads once the SDK has.
  //
  // Named imports throughout (not `import * as Sentry`) so the bundler can
  // actually see that nothing here references the recorder.
  const armReplay = () => {
    void loadSentry()
      .then((sentry) => (sentry ? import('./lib/observability/sentry-replay') : null))
      .then((m) => m?.enableSessionReplay())
      .catch(() => {
        /* replay is best-effort; error capture works without it */
      });
  };

  // Replay records the DOM and keeps a session id in sessionStorage — reading
  // or writing the visitor's device for something that is not strictly
  // necessary to deliver the page (ePrivacy art. 5(3)), so it waits for the
  // analytics consent the cookie banner collects. Error capture itself stays
  // on: it neither records the page nor stores anything on the device.
  const hasConsent = () => document.cookie.split('; ').includes('joblify_consent=all');

  let replayScheduled = false;
  const armWhenConsented = () => {
    if (replayScheduled || !hasConsent()) return;
    replayScheduled = true;
    whenIdle(armReplay, 4000);
  };

  armWhenConsented();
  // The banner dispatches this when the choice changes, so consent takes
  // effect without a reload (same event <AnalyticsGate> listens to).
  window.addEventListener('joblify:consent', armWhenConsented);
}

// App Router navigation instrumentation. Navigations that start before the SDK
// has loaded are not traced — there is no one to tell yet — which is the whole
// of what deferring it costs here.
export const onRouterTransitionStart = (
  href: string,
  navigationType: 'push' | 'replace' | 'traverse',
): void => {
  loadedSentry()?.captureRouterTransitionStart(href, navigationType);
};
