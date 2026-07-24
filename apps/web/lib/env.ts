import { z } from 'zod';

// Security-critical env vars. Absence must fail the PRODUCTION boot loudly
// (wired via instrumentation.ts) instead of silently degrading behavior at
// runtime — without this, rate limiting no-ops when the Upstash pair is
// missing and cron auth compares against the literal `Bearer undefined`.
//
// Uses console (not pino) on purpose: this can run before observability is
// up, and instrumentation may be bundled for non-node runtimes.
const criticalEnvSchema = z.object({
  CRON_SECRET: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  RESEND_WEBHOOK_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().min(1),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

export function assertCriticalEnv(): void {
  const parsed = criticalEnvSchema.safeParse(process.env);
  if (parsed.success) return;

  const missing = parsed.error.issues.map((issue) => issue.path.join('.'));
  const message = `Missing security-critical env vars: ${missing.join(', ')}`;

  if (process.env.VERCEL_ENV === 'production') {
    // Fail the deploy, not the runtime behavior.
    throw new Error(message);
  }
  console.warn(`[env] ${message} (non-production — continuing with degraded behavior)`);
}
