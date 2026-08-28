import { init, captureRouterTransitionStart } from '@sentry/nextjs';

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
