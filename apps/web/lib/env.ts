import { z } from 'zod';

/**
 * Security-critical env vars.
 *
 * Absence must be LOUD. It must not be fatal at runtime.
 *
 * That distinction is the whole point of this file, and getting it wrong took
 * production down: `assertCriticalEnv()` used to `throw` when
 * `VERCEL_ENV === 'production'`, with the comment "Fail the deploy, not the
 * runtime behavior". But it is called from `instrumentation.ts#register()`,
 * and Next runs that hook on every serverless **cold start** — not at build
 * time. So instead of failing a deploy it killed the Node process on every
 * dynamic route, with `exit status: 128`, and the browser got React's redacted
 * "An error occurred in the Server Components render" paragraph. Every
 * authenticated page, every Server Action, every API route, 500.
 *
 * The worst of it: a request could complete its work and *then* die. An
 * onboarding submit wrote the profile, logged "job seeker onboarding
 * completed", and the process exited before the redirect — so the user's data
 * changed and all they saw was an error.
 *
 * And the assertion bought nothing, because every consumer of these secrets
 * already fails closed on its own:
 *
 *   - `lib/cron-auth.ts`      — 500s when CRON_SECRET is unset, rather than
 *                               comparing against the literal `Bearer undefined`
 *   - the Clerk/Resend webhooks — 500 before signature verification
 *   - `lib/ratelimit.ts`      — degrades to a no-op limiter, by design
 *
 * So this reports, and the request path keeps working. A misconfigured deploy
 * is a page-the-owner problem, not a take-the-site-down problem.
 */

/**
 * Vercel's Upstash integration has injected both namings over time, and this
 * repo disagreed with itself: `.env.example` and `lib/ratelimit.ts` use
 * `KV_REST_API_*`, while the schema here demanded `UPSTASH_REDIS_REST_*`.
 * Following the project's own example file could therefore never satisfy this
 * check — which is exactly how production ended up in the state above.
 * Either pair now counts, in both places.
 */
export const REDIS_URL_VARS = ['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL'] as const;
export const REDIS_TOKEN_VARS = ['KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN'] as const;

const singleNameSchema = z.object({
  CRON_SECRET: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  RESEND_WEBHOOK_SECRET: z.string().min(1),
});

function firstPresent(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.length > 0) return value;
  }
  return undefined;
}

/** The names of every security-critical var that is missing. Empty when fine. */
export function missingCriticalEnv(): string[] {
  const parsed = singleNameSchema.safeParse(process.env);
  const missing = parsed.success ? [] : parsed.error.issues.map((i) => i.path.join('.'));

  if (!firstPresent(REDIS_URL_VARS)) missing.push(REDIS_URL_VARS.join(' | '));
  if (!firstPresent(REDIS_TOKEN_VARS)) missing.push(REDIS_TOKEN_VARS.join(' | '));

  return missing;
}

/**
 * Reports missing critical env. Never throws — see the note at the top.
 *
 * Uses console rather than pino on purpose: this runs from the instrumentation
 * hook, before observability is necessarily up, and instrumentation is bundled
 * for non-node runtimes too.
 */
export function reportCriticalEnv(): void {
  const missing = missingCriticalEnv();
  if (missing.length === 0) return;

  const message = `Missing security-critical env vars: ${missing.join(', ')}`;

  if (process.env.VERCEL_ENV === 'production') {
    // Loud enough to page on, via the platform's error stream and Sentry's
    // captureConsoleIntegration, without ending the process.
    console.error(
      `[env] ${message} — the affected feature fails closed at its own call site ` +
        `(cron auth 500s, webhooks 500 before verification, rate limiting no-ops). ` +
        `Fix in Vercel → Project → Settings → Environment Variables.`,
    );
    return;
  }
  console.warn(`[env] ${message} (non-production — continuing with degraded behavior)`);
}
