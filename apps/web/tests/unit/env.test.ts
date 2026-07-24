import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { assertCriticalEnv } from '@/lib/env';

const ALL_CRITICAL = {
  CRON_SECRET: 'cron-secret',
  CLERK_WEBHOOK_SECRET: 'whsec_clerk',
  RESEND_WEBHOOK_SECRET: 'whsec_resend',
  UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'token',
};

describe('assertCriticalEnv', () => {
  beforeEach(() => {
    for (const [key, value] of Object.entries(ALL_CRITICAL)) {
      vi.stubEnv(key, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('passes silently when every critical var is present', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(() => assertCriticalEnv()).not.toThrow();
  });

  it('throws in production when a critical var is missing, naming it', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('CRON_SECRET', '');
    expect(() => assertCriticalEnv()).toThrow(/CRON_SECRET/);
  });

  it('warns without throwing outside production', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('CRON_SECRET', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => assertCriticalEnv()).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]![0]).toContain('CRON_SECRET');
  });
});
