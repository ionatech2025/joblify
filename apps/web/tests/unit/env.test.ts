import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { missingCriticalEnv, reportCriticalEnv } from '@/lib/env';

const ALL_CRITICAL = {
  CRON_SECRET: 'cron-secret',
  CLERK_WEBHOOK_SECRET: 'whsec_clerk',
  RESEND_WEBHOOK_SECRET: 'whsec_resend',
  KV_REST_API_URL: 'https://example.upstash.io',
  KV_REST_API_TOKEN: 'token',
};

const CLEAR_REDIS = {
  KV_REST_API_URL: '',
  KV_REST_API_TOKEN: '',
  UPSTASH_REDIS_REST_URL: '',
  UPSTASH_REDIS_REST_TOKEN: '',
};

describe('critical env', () => {
  beforeEach(() => {
    for (const [key, value] of Object.entries(ALL_CRITICAL)) vi.stubEnv(key, value);
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reports nothing missing when every critical var is present', () => {
    expect(missingCriticalEnv()).toEqual([]);
  });

  it('names a missing var', () => {
    vi.stubEnv('CRON_SECRET', '');
    expect(missingCriticalEnv()).toContain('CRON_SECRET');
  });

  // The two namings Vercel's Upstash integration has used over time. The
  // schema used to demand UPSTASH_REDIS_REST_*, while .env.example and
  // lib/ratelimit.ts both used KV_REST_API_* — so following the project's own
  // example file could never satisfy the check, and production 500'd.
  it('accepts KV_REST_API_* for the Redis pair', () => {
    expect(missingCriticalEnv()).toEqual([]);
  });

  it('accepts UPSTASH_REDIS_REST_* for the Redis pair', () => {
    for (const [key, value] of Object.entries(CLEAR_REDIS)) vi.stubEnv(key, value);
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token');
    expect(missingCriticalEnv()).toEqual([]);
  });

  it('reports the Redis pair as missing only when NEITHER naming is set', () => {
    for (const [key, value] of Object.entries(CLEAR_REDIS)) vi.stubEnv(key, value);
    const missing = missingCriticalEnv();
    expect(missing.some((m) => m.includes('KV_REST_API_URL'))).toBe(true);
    expect(missing.some((m) => m.includes('KV_REST_API_TOKEN'))).toBe(true);
  });

  // The regression that took production down: this ran from
  // instrumentation.ts#register(), which Next calls on every serverless cold
  // start — so throwing here 500'd every dynamic route rather than failing a
  // deploy. It must report and return, in production above all.
  it('does NOT throw in production when a critical var is missing', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('CRON_SECRET', '');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => reportCriticalEnv()).not.toThrow();
    expect(error).toHaveBeenCalledOnce();
    expect(error.mock.calls[0]![0]).toContain('CRON_SECRET');
  });

  it('warns without throwing outside production', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('CRON_SECRET', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => reportCriticalEnv()).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]![0]).toContain('CRON_SECRET');
  });

  it('says nothing at all when everything is present', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    // The non-fatal deployment-config checks (contact addresses, unsubscribe,
    // storage) are part of "everything": a fully configured production.
    for (const [k, v] of Object.entries({
      NEXT_PUBLIC_PRIVACY_EMAIL: 'privacy@joblify.com',
      NEXT_PUBLIC_ACCESSIBILITY_EMAIL: 'a11y@joblify.com',
      NEXT_PUBLIC_SITE_URL: 'https://joblify.com',
      EMAIL_POSTAL_ADDRESS: '1 Main St',
      BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_x_y',
      BLOB_PUBLIC_READ_WRITE_TOKEN: 'vercel_blob_rw_z_y',
    })) {
      vi.stubEnv(k, v);
    }
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    reportCriticalEnv();
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('reports non-fatal config that breaks a promise to users (production only), and never throws', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_PRIVACY_EMAIL', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => reportCriticalEnv()).not.toThrow();
    expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).toMatch(
      /\[config\].*PRIVACY_EMAIL/,
    );
  });

  it('stays quiet about deployment config outside production', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('NEXT_PUBLIC_PRIVACY_EMAIL', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    reportCriticalEnv();
    expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).not.toMatch(/\[config\]/);
  });
});
