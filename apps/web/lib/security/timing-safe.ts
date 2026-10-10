import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time string equality for secrets and tokens.
 *
 * Both inputs are hashed first so the comparison is always over two 32-byte
 * digests: `timingSafeEqual` throws on unequal lengths, and checking length
 * beforehand would itself leak it.
 */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}
