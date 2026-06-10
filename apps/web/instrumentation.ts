import * as Sentry from '@sentry/nextjs';
import { init } from './lib/observability/sentry';

// Next.js instrumentation hook. Runs once per server runtime (nodejs + edge).
// Sentry stays a no-op until SENTRY_DSN is provisioned (see lib/observability/sentry.ts).
export async function register(): Promise<void> {
  init();
}

// Forwards nested RSC / Route Handler errors to Sentry. No-op when Sentry was
// never initialised.
export const onRequestError = Sentry.captureRequestError;
