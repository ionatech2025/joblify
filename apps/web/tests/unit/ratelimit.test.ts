import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRateLimiter, parseWindow } from '@/lib/ratelimit-memory';

describe('parseWindow', () => {
  it('parses the Upstash duration strings used in lib/ratelimit.ts', () => {
    expect(parseWindow('1 d')).toBe(86_400_000);
    expect(parseWindow('10 m')).toBe(600_000);
    expect(parseWindow('1 h')).toBe(3_600_000);
    expect(parseWindow('30 s')).toBe(30_000);
  });
  it('rejects anything else rather than guessing', () => {
    expect(() => parseWindow('a while')).toThrow();
    expect(() => parseWindow('1 fortnight')).toThrow();
  });
});

describe('MemoryRateLimiter', () => {
  it('admits up to the limit inside the window, then refuses', () => {
    const rl = new MemoryRateLimiter(3, 1000, 100, () => 0);
    expect([1, 2, 3].map(() => rl.check('k').success)).toEqual([true, true, true]);
    expect(rl.check('k')).toMatchObject({ success: false, remaining: 0 });
  });

  it('is a SLIDING window: capacity returns as old hits age out', () => {
    let t = 0;
    const rl = new MemoryRateLimiter(2, 1000, 100, () => t);
    rl.check('k'); // t=0
    t = 600;
    rl.check('k'); // t=600
    expect(rl.check('k').success).toBe(false);
    t = 1001; // the t=0 hit has expired, the t=600 one has not
    expect(rl.check('k').success).toBe(true);
    expect(rl.check('k').success).toBe(false);
  });

  it('keeps identifiers independent', () => {
    const rl = new MemoryRateLimiter(1, 1000, 100, () => 0);
    expect(rl.check('a').success).toBe(true);
    expect(rl.check('b').success).toBe(true);
    expect(rl.check('a').success).toBe(false);
  });

  it('is memory-bounded: rotating identifiers cannot grow it without limit', () => {
    const rl = new MemoryRateLimiter(1, 60_000, 50, () => 0);
    for (let i = 0; i < 500; i++) rl.check(`ip-${i}`);
    // @ts-expect-error — inspecting the private map is the point of the test
    expect(rl.hits.size).toBeLessThanOrEqual(50);
  });
});

// The production module wires the shared (Redis) limiter to the in-memory one.
const redisState = vi.hoisted(() => ({ configured: false, throws: false }));
vi.mock('@upstash/redis', () => ({
  Redis: class {
    ping = async () => 'PONG';
  },
}));
vi.mock('@upstash/ratelimit', () => {
  class Ratelimit {
    static slidingWindow = (limit: number, window: string) => ({ limit, window });
    limit = async () => {
      if (redisState.throws) throw new Error('redis down');
      return { success: true, remaining: 99, reset: 0 };
    };
  }
  return { Ratelimit };
});

describe('lib/ratelimit — never "off"', () => {
  // Env is stubbed per test (not in beforeEach) so each case states exactly
  // which world it is in: Redis absent, Redis erroring, Redis healthy.
  function world(opts: { configured: boolean; throws?: boolean }) {
    vi.resetModules();
    vi.stubEnv('KV_REST_API_URL', opts.configured ? 'https://redis.test' : '');
    vi.stubEnv('KV_REST_API_TOKEN', opts.configured ? 'tok' : '');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    redisState.throws = opts.throws ?? false;
  }

  beforeEach(() => vi.unstubAllEnvs());

  it('with no Redis configured, enforces the limit per instance instead of allowing everything', async () => {
    world({ configured: false });
    const { postJobLimit } = await import('@/lib/ratelimit'); // 10 / day
    const results: boolean[] = [];
    for (let i = 0; i < 12; i++) results.push((await postJobLimit('company-1')).success);
    expect(results.slice(0, 10).every(Boolean)).toBe(true);
    expect(results.slice(10)).toEqual([false, false]);
  });

  it('when Redis is configured but erroring, falls back to the in-memory limit (no fail-open, no 500)', async () => {
    world({ configured: true, throws: true });
    const { postJobLimit } = await import('@/lib/ratelimit');
    const results: boolean[] = [];
    for (let i = 0; i < 11; i++) results.push((await postJobLimit('company-2')).success);
    expect(results[9]).toBe(true);
    expect(results[10]).toBe(false);
  });

  it('uses the shared limiter when Redis is healthy', async () => {
    world({ configured: true });
    const { postJobLimit } = await import('@/lib/ratelimit');
    const r = await postJobLimit('company-3');
    expect(r).toEqual({ success: true, remaining: 99, reset: 0 });
  });
});
