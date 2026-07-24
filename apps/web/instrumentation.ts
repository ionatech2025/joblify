import * as Sentry from '@sentry/nextjs';
import { init } from './lib/observability/sentry';
import { assertCriticalEnv } from './lib/env';

// Next.js instrumentation hook. Runs once per server runtime (nodejs + edge).
// Sentry stays a no-op until SENTRY_DSN is provisioned (see lib/observability/sentry.ts).
export async function register(): Promise<void> {
  init();
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Fails the production boot when a security-critical secret is missing,
    // so misconfiguration cannot silently degrade auth or rate limiting.
    assertCriticalEnv();
  }
}

// Forwards nested RSC / Route Handler errors to Sentry. No-op when Sentry was
// never initialised.
export const onRequestError = Sentry.captureRequestError;
