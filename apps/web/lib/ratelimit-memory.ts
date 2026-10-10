/**
 * In-process sliding-window limiter used when the shared (Redis) limiter is
 * unavailable. Dependency-free on purpose so it can be unit-tested directly and
 * imported without pulling Upstash in.
 *
 * Memory is bounded: at most `maxKeys` identifiers are tracked and each holds
 * at most `limit` timestamps, so an attacker rotating identifiers cannot grow
 * it without bound — the oldest-touched key is evicted first.
 */

const UNITS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Parses the "10 m" / "1 d" strings Upstash's `Duration` uses into ms. */
export function parseWindow(window: string): number {
  const match = /^\s*(\d+)\s*(ms|s|m|h|d)\s*$/.exec(window);
  if (!match) throw new Error(`Unsupported rate-limit window "${window}"`);
  return Number(match[1]) * UNITS[match[2] as keyof typeof UNITS]!;
}

export type MemoryResult = { success: boolean; remaining: number; reset: number };

export class MemoryRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 5_000,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): MemoryResult {
    const t = this.now();
    const cutoff = t - this.windowMs;

    const live = (this.hits.get(key) ?? []).filter((ts) => ts > cutoff);

    if (live.length >= this.limit) {
      // Re-insert so a hammering key stays "recent" and is not evicted.
      this.hits.delete(key);
      this.hits.set(key, live);
      return { success: false, remaining: 0, reset: (live[0] ?? t) + this.windowMs };
    }

    live.push(t);
    this.hits.delete(key); // move to the end → Map iteration order == LRU order
    this.hits.set(key, live);

    if (this.hits.size > this.maxKeys) {
      const oldest = this.hits.keys().next().value;
      if (oldest !== undefined) this.hits.delete(oldest);
    }

    return {
      success: true,
      remaining: this.limit - live.length,
      reset: (live[0] ?? t) + this.windowMs,
    };
  }
}
