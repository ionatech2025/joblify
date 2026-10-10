import { describe, it, expect } from 'vitest';
import { clientIp, hashIpForAnalytics } from '@/lib/security/client-ip';

const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });

describe('clientIp', () => {
  it('takes the first forwarded address', () => {
    expect(clientIp(h({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7');
  });
  it('falls back to x-real-ip, then null', () => {
    expect(clientIp(h({ 'x-real-ip': '198.51.100.9' }))).toBe('198.51.100.9');
    expect(clientIp(h({}))).toBeNull();
  });
});

describe('hashIpForAnalytics', () => {
  it('is stable within a day for one visitor and differs between visitors', () => {
    const d = new Date('2026-10-10T08:00:00Z');
    expect(hashIpForAnalytics('203.0.113.7', d)).toBe(hashIpForAnalytics('203.0.113.7', d));
    expect(hashIpForAnalytics('203.0.113.7', d)).not.toBe(hashIpForAnalytics('203.0.113.8', d));
  });

  it('is NOT linkable across days (the salt rotates)', () => {
    const a = hashIpForAnalytics('203.0.113.7', new Date('2026-10-10T23:59:00Z'));
    const b = hashIpForAnalytics('203.0.113.7', new Date('2026-10-11T00:01:00Z'));
    expect(a).not.toBe(b);
  });

  it('is 32 hex characters and never contains the address', () => {
    const v = hashIpForAnalytics('203.0.113.7');
    expect(v).toMatch(/^[0-9a-f]{32}$/);
  });
});
