import { vi, describe, it, expect, afterEach } from 'vitest';

vi.mock('@/lib/observability/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { requireCronAuth } from '@/lib/cron-auth';

function request(authorization?: string): Request {
  return new Request('http://localhost/api/v1/cron/test', {
    headers: authorization ? { authorization } : {},
  });
}

describe('requireCronAuth', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('fails closed with 500 when CRON_SECRET is unset', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const deny = requireCronAuth(request('Bearer undefined'));
    expect(deny).not.toBeNull();
    expect(deny!.status).toBe(500);
  });

  it('rejects the literal "Bearer undefined" header when the secret is unset', () => {
    vi.stubEnv('CRON_SECRET', '');
    const deny = requireCronAuth(request('Bearer undefined'));
    expect(deny).not.toBeNull();
    expect(deny!.status).not.toBe(200);
  });

  it('returns 401 for a wrong bearer token', () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret-value');
    const deny = requireCronAuth(request('Bearer wrong-secret-value'));
    expect(deny).not.toBeNull();
    expect(deny!.status).toBe(401);
  });

  it('returns 401 when the header is missing entirely', () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret-value');
    const deny = requireCronAuth(request());
    expect(deny).not.toBeNull();
    expect(deny!.status).toBe(401);
  });

  it('returns null (authorized) for the correct bearer token', () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret-value');
    expect(requireCronAuth(request('Bearer correct-secret-value'))).toBeNull();
  });
});
