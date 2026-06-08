import * as Sentry from '@sentry/nextjs';

// Single Sentry init for the Node + Edge server runtimes. DSN-gated: until the
// Marketplace integration provisions SENTRY_DSN this is a no-op, so boot never
// fails on missing config. Called from instrumentation.ts `register()`.

const REDACT_KEYS = ['password', 'confirmPassword', 'token', 'authorization', 'cookie', 'refreshToken'];

export function init(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Expected control-flow, not bugs — keep them out of the error budget.
    ignoreErrors: [
      'AuthError',
      'FORBIDDEN',
      'UNAUTHENTICATED',
      /rate limit/i,
      /Daily application limit/i,
    ],
    beforeSend(event) {
      const data = event.request?.data;
      if (data && typeof data === 'object') {
        const rec = data as Record<string, unknown>;
        for (const k of REDACT_KEYS) if (k in rec) rec[k] = '[REDACTED]';
      }
      if (event.request?.cookies) event.request.cookies = { redacted: '[REDACTED]' };
      return event;
    },
  });
}
