import { test, expect } from '@playwright/test';

// API regression — invariants that must hold regardless of which vendors are
// wired (so it's valid against both a no-vendor local run and a full preview).
// Notably locks the rate-limit fail-open fix: search must never return a 500.
test.describe('API regression', () => {
  test('GET /api/v1/health → 200 ok, and reveals nothing else to anonymous callers', async ({
    request,
  }) => {
    const res = await request.get('/api/v1/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    // The dependency map used to be public and advertised "redis: not_configured".
    expect(body).not.toHaveProperty('dependencies');
    expect(body).not.toHaveProperty('commit');
  });

  test('a résumé is not readable without a session', async ({ request }) => {
    const res = await request.get('/api/v1/resumes/11111111-1111-4111-8111-111111111111/file');
    expect(res.status()).toBe(401);
  });

  test('the unsubscribe endpoint rejects a forged token and never mutates on GET', async ({
    request,
  }) => {
    const bad = '/api/v1/email/unsubscribe?t=not-a-real-token';
    expect((await request.get(bad)).status()).toBe(400);
    expect((await request.post(bad)).status()).toBe(400);
  });

  test('GET /api/v1/applications → 401 when unauthenticated', async ({ request }) => {
    expect((await request.get('/api/v1/applications')).status()).toBe(401);
  });

  test('search degrades gracefully — never a 500', async ({ request }) => {
    const res = await request.get('/api/v1/jobs/search?q=engineer');
    // 200 with Algolia wired, 502 without — but never an unhandled 5xx crash.
    expect([200, 502]).toContain(res.status());
  });

  test('cron routes reject without the bearer secret', async ({ request }) => {
    for (const path of [
      '/api/v1/cron/digest-email',
      '/api/v1/cron/retention',
      '/api/v1/cron/algolia-reconcile',
    ]) {
      expect((await request.get(path)).status(), path).toBe(401);
    }
  });

  test('view beacon returns 204', async ({ request }) => {
    const res = await request.post('/api/v1/jobs/11111111-1111-1111-1111-111111111111/view');
    expect(res.status()).toBe(204);
  });

  test('resend webhook rejects an unsigned payload', async ({ request }) => {
    const res = await request.post('/api/v1/webhooks/resend', { data: {} });
    // 400 (missing/invalid signature) or 500 (secret not configured) — never accepted.
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('cron runs when given the configured secret', async ({ request }) => {
    const secret = process.env.CRON_SECRET;
    test.skip(!secret, 'CRON_SECRET not set in this environment');
    const res = await request.get('/api/v1/cron/algolia-reconcile', {
      headers: { authorization: `Bearer ${secret}` },
    });
    expect(res.status()).toBe(200);
  });
});
