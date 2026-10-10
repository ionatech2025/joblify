import { createHmac, randomBytes } from 'node:crypto';

/**
 * The caller's IP as the platform saw it.
 *
 * On Vercel the edge overwrites `x-forwarded-for`/`x-real-ip` with the real
 * client address, so these headers are trustworthy there. They are NOT
 * trustworthy behind an arbitrary reverse proxy — if this app is ever
 * self-hosted, revisit.
 */
export function clientIp(headers: { get(name: string): string | null }): string | null {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip')?.trim() || null;
}

// Used only when no secret is configured: a per-process key still makes the
// hash non-reversible by enumeration; it just rotates on every cold start,
// which is acceptable for approximate unique-visitor counts.
const PROCESS_KEY = randomBytes(32);

function hashKey(): string | Buffer {
  return process.env.ANALYTICS_HASH_SECRET || process.env.CRON_SECRET || PROCESS_KEY;
}

/**
 * Pseudonymise an IP for analytics: HMAC-SHA256 keyed with a server secret and
 * salted with the UTC date.
 *
 * The previous `sha256(ip)` was not pseudonymisation at all — IPv4 has only
 * 2^32 values, so every stored hash could be inverted by hashing the whole
 * address space. Keying defeats that, and the date salt stops one visitor being
 * linkable across days, which is also what keeps this inside the
 * "audience-measurement" posture regulators accept without consent.
 */
export function hashIpForAnalytics(ip: string, now: Date = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  return createHmac('sha256', hashKey()).update(`${day}|${ip}`).digest('hex').slice(0, 32);
}
