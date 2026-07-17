import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

export type Limiter = (identifier: string) => Promise<RateLimitResult>;

let _redis: Redis | null = null;

function redis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.KV_REST_API_URL;
  // Treat missing OR non-URL (e.g. an un-filled placeholder) as "not configured"
  // so a bad value can't crash every rate-limited route at module load.
  if (!url || !process.env.KV_REST_API_TOKEN || !url.startsWith('http')) return null;
  try {
    _redis = Redis.fromEnv();
    return _redis;
  } catch {
    return null;
  }
}

const allowAll: RateLimitResult = { success: true, remaining: Number.MAX_SAFE_INTEGER, reset: 0 };

// Cheap connectivity check for /api/v1/health — rate limiting already
// degrades gracefully without Redis, so this reports status rather than
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

// Returns a no-op limiter when Upstash isn't configured (local dev without
// `vercel env pull`) so the request path always works. Production always has
// the env wired via Marketplace, so the real limiter is in effect.
function makeLimit(prefix: string, limit: ReturnType<typeof Ratelimit.slidingWindow>): Limiter {
  const client = redis();
  if (!client) return async () => allowAll;
  const rl = new Ratelimit({
    redis: client,
    limiter: limit,
    prefix: `joblify:${prefix}`,
    analytics: true,
  });
  return async (identifier) => {
    try {
      const { success, remaining, reset } = await rl.limit(identifier);
      return { success, remaining, reset };
    } catch {
      // Upstash unavailable mid-request — fail open rather than 500 the route.
      return allowAll;
    }
  };
}

// Per-route limits — tune from observability. Identifier is typically
// `${userId}` for authenticated routes or `${ip}` for public ones.
export const signupLimit: Limiter = makeLimit('signup', Ratelimit.slidingWindow(3, '1 h'));
export const signinLimit: Limiter = makeLimit('signin', Ratelimit.slidingWindow(10, '15 m'));
export const applyLimit: Limiter = makeLimit('apply', Ratelimit.slidingWindow(20, '1 d'));
export const accountExportLimit: Limiter = makeLimit('account-export', Ratelimit.slidingWindow(2, '1 d'));
export const searchLimit: Limiter = makeLimit('search', Ratelimit.slidingWindow(100, '1 m'));
export const globalLimit: Limiter = makeLimit('global', Ratelimit.slidingWindow(600, '15 m'));
// Each post/update triggers a paid AI Gateway skill-extraction call + an
// Algolia reindex — unthrottled writes are a direct cost-abuse vector, not
// just a spam nuisance.
export const postJobLimit: Limiter = makeLimit('post-job', Ratelimit.slidingWindow(10, '1 d'));
export const inviteLimit: Limiter = makeLimit('invite', Ratelimit.slidingWindow(30, '1 d'));
export const chatMessageLimit: Limiter = makeLimit('chat-message', Ratelimit.slidingWindow(60, '10 m'));
