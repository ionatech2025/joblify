import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  limit: vi.fn(),
  jobFindFirst: vi.fn(),
  jobUpdate: vi.fn(),
  viewCreate: vi.fn(),
  transaction: vi.fn(),
  currentUser: vi.fn(),
  after: vi.fn(),
}));

vi.mock('@/lib/ratelimit', () => ({ viewBeaconLimit: m.limit }));
vi.mock('@/lib/auth', () => ({ currentUser: m.currentUser }));
vi.mock('@/lib/db', () => ({
  db: {
    jobPost: { findFirst: m.jobFindFirst, update: m.jobUpdate },
    jobView: { create: m.viewCreate },
    $transaction: m.transaction,
  },
}));
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, after: (fn: () => unknown) => m.after(fn) };
});

import { POST } from '@/app/api/v1/jobs/[id]/view/route';

const JOB = '11111111-1111-4111-8111-111111111111';
const params = { params: Promise.resolve({ id: JOB }) };

function beacon(headers: Record<string, string> = {}) {
  return new Request('http://t/api/v1/jobs/x/view', {
    method: 'POST',
    headers: {
      'x-forwarded-for': '198.51.100.20',
      referer: 'https://google.com/?q=jobs',
      ...headers,
    },
  });
}

async function flush() {
  for (const [fn] of m.after.mock.calls) await (fn as () => Promise<void>)();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('ANALYTICS_HASH_SECRET', 'hash-secret');
  m.limit.mockResolvedValue({ success: true });
  m.jobFindFirst.mockResolvedValue({ id: JOB });
  m.currentUser.mockResolvedValue({ id: 'user-1' });
  m.transaction.mockResolvedValue([]);
  m.viewCreate.mockReturnValue('create-op');
  m.jobUpdate.mockReturnValue('update-op');
});

describe('POST /api/v1/jobs/[id]/view', () => {
  it('without analytics consent a view is an anonymous count — no user, no referrer', async () => {
    const res = await POST(beacon(), params);
    expect(res.status).toBe(204);
    await flush();
    const data = m.viewCreate.mock.calls[0]![0].data;
    expect(data.userId).toBeNull();
    expect(data.referrer).toBeNull();
    expect(m.currentUser).not.toHaveBeenCalled();
  });

  it('with consent it records the signed-in user and referrer', async () => {
    await POST(beacon({ cookie: 'a=b; joblify_consent=all' }), params);
    await flush();
    const data = m.viewCreate.mock.calls[0]![0].data;
    expect(data.userId).toBe('user-1');
    expect(data.referrer).toBe('https://google.com/?q=jobs');
  });

  it('never stores the IP, and the stored value is not a bare SHA-256 of it', async () => {
    await POST(beacon(), params);
    await flush();
    const { ipHash } = m.viewCreate.mock.calls[0]![0].data;
    const { createHash } = await import('node:crypto');
    const naive = createHash('sha256').update('198.51.100.20').digest('hex').slice(0, 32);
    expect(ipHash).toMatch(/^[0-9a-f]{32}$/);
    expect(ipHash).not.toBe(naive); // would be reversible by enumerating IPv4
    expect(JSON.stringify(m.viewCreate.mock.calls)).not.toContain('198.51.100.20');
  });

  it('is rate limited per IP and answers 204 either way (the limiter is not revealed)', async () => {
    m.limit.mockResolvedValue({ success: false });
    const res = await POST(beacon(), params);
    expect(res.status).toBe(204);
    expect(m.jobFindFirst).not.toHaveBeenCalled();
    expect(m.after).not.toHaveBeenCalled();
    expect(m.limit).toHaveBeenCalledWith('198.51.100.20');
  });

  it('ignores ids that are not UUIDs and unknown jobs', async () => {
    expect((await POST(beacon(), { params: Promise.resolve({ id: 'nope' }) })).status).toBe(204);
    m.jobFindFirst.mockResolvedValue(null);
    expect((await POST(beacon(), params)).status).toBe(204);
    expect(m.after).not.toHaveBeenCalled();
  });
});
