import { init, captureRouterTransitionStart } from '@sentry/nextjs';
import { initBotId } from 'botid/client/core';

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
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });

  // Replay is added after boot rather than passed to init(). With
  // replaysSessionSampleRate: 0 the recorder only ever uploads on an error, but
  // as a static integration it still rode along in the chunk shared by every
  // route — including /sign-up and /onboarding, where it is pure dead weight on
  // the critical path. It still has to be armed *before* an error to hold the
  // rolling buffer, so it loads at first idle rather than on demand.
  //
  // Named imports throughout this file (not `import * as Sentry`) so the
  // bundler can actually see that nothing here references the recorder.
  const armReplay = () => {
    void import('./lib/observability/sentry-replay')
      .then((m) => m.enableSessionReplay())
      .catch(() => {
        /* replay is best-effort; error capture works without it */
      });
  };

  // Checked by typeof rather than `in`: Window declares requestIdleCallback, so
  // an `in` guard narrows the else branch to never and the fallback stops
  // compiling — while Safari still only shipped it in 18.4.
  if (typeof window !== 'undefined') {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(armReplay, { timeout: 4000 });
    } else {
      window.setTimeout(armReplay, 2000);
    }
  }
}

// App Router navigation instrumentation.
export const onRouterTransitionStart = captureRouterTransitionStart;
