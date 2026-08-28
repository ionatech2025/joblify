import * as Sentry from '@sentry/nextjs';
import { init } from './lib/observability/sentry';
import { reportCriticalEnv } from './lib/env';

// Next.js instrumentation hook. Runs once per server runtime (nodejs + edge).
// Sentry stays a no-op until SENTRY_DSN is provisioned (see lib/observability/sentry.ts).
export async function register(): Promise<void> {
  init();
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Reports — never throws. This hook runs on every serverless cold start,
    // not at build time, so throwing here 500s every dynamic route instead of
    // failing a deploy. See the note at the top of lib/env.ts.
    reportCriticalEnv();
  }
}

// Forwards nested RSC / Route Handler errors to Sentry. No-op when Sentry was
// never initialised.
export const onRequestError = Sentry.captureRequestError;
