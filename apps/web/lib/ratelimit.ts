import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { REDIS_URL_VARS, REDIS_TOKEN_VARS } from '@/lib/env';
import { MemoryRateLimiter, parseWindow } from '@/lib/ratelimit-memory';

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

export type Limiter = (identifier: string) => Promise<RateLimitResult>;

let _redis: Redis | null = null;

function redis(): Redis | null {
  if (_redis) return _redis;
  // Vercel's Upstash integration has used both namings; accept either, and
  // stay in step with lib/env.ts, which used to demand the pair this file did
  // not read — so a correctly-configured deploy still failed the check.
  const url = firstEnv(REDIS_URL_VARS);
  const token = firstEnv(REDIS_TOKEN_VARS);
  // Treat missing OR non-URL (e.g. an un-filled placeholder) as "not configured"
  // so a bad value can't crash every rate-limited route at module load.
  if (!url || !token || !url.startsWith('http')) return null;
  try {
    _redis = new Redis({ url, token });
    return _redis;
  } catch {
    return null;
  }
}

function firstEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.length > 0) return value;
  }
  return undefined;
}

// Cheap connectivity check for /api/v1/health — rate limiting degrades to the
// per-instance fallback without Redis, so this reports status rather than
// throwing or blocking a route.
export async function pingRedis(): Promise<'ok' | 'not_configured' | 'error'> {
  const client = redis();
  if (!client) return 'not_configured';
  try {
    await client.ping();
    return 'ok';
  } catch {
    return 'error';
  }
}

let warnedDegraded = false;
function warnDegradedOnce(reason: string): void {
  if (warnedDegraded) return;
  warnedDegraded = true;
  // console, not pino: this module is imported by routes that must not pull
  // the logger graph in, and one line per cold start is all that is wanted.
  console.error(
    `[ratelimit] ${reason} — using the per-instance in-memory limiter. Limits are NOT ` +
      `shared across serverless instances until Upstash Redis is reachable.`,
  );
}

/**
 * A limiter that is never "off".
 *
 * Before: no Redis configured → `allowAll`, and a Redis error mid-request →
 * `allowAll` ("fail open rather than 500 the route"). Combined with production
 * missing its Upstash variables, that meant apply, post-job, invite, chat,
 * search and the paid AI routes had no ceiling at all (OWASP A10:2025 lists
 * failing open as its own risk class).
 *
 * Now the shared Redis limiter is the primary, and the same limit is enforced
 * in-process whenever Redis is absent or erroring. Per-instance counters are
 * weaker than a shared one — N warm instances admit up to N× the limit — but
 * they are a hard ceiling per instance rather than none, and the request path
 * still never 500s on a limiter fault.
 */
function makeLimit(prefix: string, limit: number, window: string): Limiter {
  const memory = new MemoryRateLimiter(limit, parseWindow(window));
  const key = (id: string) => `${prefix}:${id}`;

  let upstash: Ratelimit | null = null;
  function shared(): Ratelimit | null {
    if (upstash) return upstash;
    const client = redis();
    if (!client) return null;
    upstash = new Ratelimit({
      redis: client,
      // Ratelimit.slidingWindow wants its own template-literal Duration type;
      // `window` is validated by parseWindow() above, so the cast is safe.
      limiter: Ratelimit.slidingWindow(
        limit,
        window as Parameters<typeof Ratelimit.slidingWindow>[1],
      ),
      prefix: `joblify:${prefix}`,
      // `analytics: true` doubles the Redis commands per check for a dashboard
      // nobody reads; the per-route limits are tuned from application metrics.
      analytics: false,
    });
    return upstash;
  }

  return async (identifier) => {
    const rl = shared();
    if (!rl) {
      warnDegradedOnce('Upstash Redis is not configured');
      return memory.check(key(identifier));
    }
    try {
      const { success, remaining, reset } = await rl.limit(identifier);
      return { success, remaining, reset };
    } catch {
      warnDegradedOnce('Upstash Redis call failed');
      return memory.check(key(identifier));
    }
  };
}

// Per-route limits — tune from observability. Identifier is typically
// `${userId}` for authenticated routes or `${ip}` for public ones.
//
// Everything here is CALLED. `signupLimit`, `signinLimit` and `globalLimit` used
// to sit in this file, configured and commented, with zero call sites — so the
// file told the next reader that sign-up and sign-in were throttled when they
// were not. Sign-up/sign-in are Clerk-hosted (Clerk applies its own bot and
// brute-force protection and this app never sees the request), and a global
// per-IP ceiling belongs at the edge, not in a route handler that has already
// done its database work. Both were removed rather than left as decoration; if
// either is wanted later, add the call site in the same commit as the limiter.
export const applyLimit: Limiter = makeLimit('apply', 20, '1 d');
export const accountExportLimit: Limiter = makeLimit('account-export', 2, '1 d');
export const searchLimit: Limiter = makeLimit('search', 100, '1 m');
// Every call is a paid AI Gateway completion. Was borrowing applyLimit under a
// different identifier — a separate bucket in practice, but governed by a
// ceiling named and tuned for job applications, which is not a number anyone
// would pick for inference spend.
export const bioCoachLimit: Limiter = makeLimit('bio-coach', 30, '1 h');
// Minting a scoped Blob upload token is cheap for us and cheap to repeat; size
// and MIME are already constrained, request count was not.
export const uploadSignLimit: Limiter = makeLimit('upload-sign', 40, '1 h');
// Each post/update triggers a paid AI Gateway skill-extraction call + an
// Algolia reindex — unthrottled writes are a direct cost-abuse vector, not
// just a spam nuisance.
export const postJobLimit: Limiter = makeLimit('post-job', 10, '1 d');
export const inviteLimit: Limiter = makeLimit('invite', 30, '1 d');
export const chatMessageLimit: Limiter = makeLimit('chat-message', 60, '10 m');
// The view beacon is unauthenticated and writes two rows per hit. Generous for
// a person browsing, tight enough that it is not a free write amplifier.
export const viewBeaconLimit: Limiter = makeLimit('job-view', 120, '1 h');
// Public, unauthenticated, state-changing (flips a user's email opt-in) — keyed
// by IP so a leaked token cannot be used to hammer the endpoint.
export const unsubscribeLimit: Limiter = makeLimit('unsubscribe', 30, '1 h');
// Authenticated download of a stored resume. Cheap per call, but each one
// streams up to RESUME_MAX_BYTES through a function.
export const resumeDownloadLimit: Limiter = makeLimit('resume-download', 120, '1 h');
// A report costs a moderator's time, so it is throttled per reporter: enough to
// flag several bad postings in a sitting, not enough to bury the queue.
export const reportLimit: Limiter = makeLimit('job-report', 10, '1 d');
