import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({ queryRaw: vi.fn(), pingRedis: vi.fn(), pingAlgolia: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { $queryRaw: m.queryRaw } }));
vi.mock('@/lib/ratelimit', () => ({ pingRedis: m.pingRedis }));
vi.mock('@/lib/search/algolia', () => ({ pingAlgolia: m.pingAlgolia }));

import { GET } from '@/app/api/v1/health/route';

const anon = () => new Request('http://t/api/v1/health');
const operator = (token = 'ops-token') =>
  new Request('http://t/api/v1/health', { headers: { authorization: `Bearer ${token}` } });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('HEALTH_TOKEN', 'ops-token');
  vi.stubEnv('CRON_SECRET', '');
  vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'abc123');
  m.queryRaw.mockResolvedValue([{ '?column?': 1 }]);
  m.pingRedis.mockResolvedValue('not_configured');
  m.pingAlgolia.mockResolvedValue('ok');
});

describe('GET /api/v1/health', () => {
  it('tells an anonymous caller only ok/unhealthy — no dependency map, commit or region', async () => {
    const res = await GET(anon());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('does not fan out to Redis or Algolia for an anonymous caller', async () => {
    await GET(anon());
    expect(m.pingRedis).not.toHaveBeenCalled();
    expect(m.pingAlgolia).not.toHaveBeenCalled();
  });

  it('503s when the database is down, still without detail', async () => {
    m.queryRaw.mockRejectedValue(new Error('connection refused'));
    const res = await GET(anon());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'unhealthy' });
  });

  it('gives an operator the full report', async () => {
    const res = await GET(operator());
    const body = await res.json();
    expect(body).toMatchObject({
      status: 'ok',
      commit: 'abc123',
      dependencies: { database: 'ok', redis: 'not_configured', search: 'ok' },
    });
  });

  it('a wrong token is treated as anonymous', async () => {
    const body = await (await GET(operator('guess'))).json();
    expect(body).toEqual({ status: 'ok' });
  });

  it('with no token configured nobody is an operator', async () => {
    vi.stubEnv('HEALTH_TOKEN', '');
    const body = await (await GET(operator(''))).json();
    expect(body).toEqual({ status: 'ok' });
  });

  it('is never cacheable', async () => {
    expect((await GET(anon())).headers.get('cache-control')).toBe('no-store');
  });
});
