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
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  _redis = Redis.fromEnv();
  return _redis;
}

const allowAll: RateLimitResult = { success: true, remaining: Number.MAX_SAFE_INTEGER, reset: 0 };

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
    const { success, remaining, reset } = await rl.limit(identifier);
    return { success, remaining, reset };
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
