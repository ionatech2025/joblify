import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  updateMany: vi.fn(),
  auditCreate: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: { user: { updateMany: m.updateMany }, auditEvent: { create: m.auditCreate } },
}));
vi.mock('@/lib/ratelimit', () => ({ unsubscribeLimit: m.limit }));
vi.mock('@/lib/observability/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { GET, POST } from '@/app/api/v1/email/unsubscribe/route';
import {
  signUnsubscribeToken,
  unsubscribeUrl,
  verifyUnsubscribeToken,
} from '@/lib/email/unsubscribe';

const USER = '11111111-2222-4333-8444-555555555555';

function url(token?: string) {
  const t = token === undefined ? signUnsubscribeToken(USER)! : token;
  return `https://joblify.test/api/v1/email/unsubscribe?t=${encodeURIComponent(t)}`;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'unit-test-secret');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://joblify.test');
  m.limit.mockResolvedValue({ success: true });
  m.updateMany.mockResolvedValue({ count: 1 });
  m.auditCreate.mockResolvedValue({});
});

describe('tokens', () => {
  it('round-trips for the user they were issued to', () => {
    const t = signUnsubscribeToken(USER)!;
    expect(verifyUnsubscribeToken(t)).toBe(USER);
  });

  it('cannot be forged, retargeted or truncated', () => {
    const t = signUnsubscribeToken(USER)!;
    const other = '99999999-2222-4333-8444-555555555555';
    expect(verifyUnsubscribeToken(`${other}.${t.split('.')[1]}`)).toBeNull(); // another user's id
    expect(verifyUnsubscribeToken(t.slice(0, -2))).toBeNull();
    expect(verifyUnsubscribeToken('not-a-token')).toBeNull();
    expect(verifyUnsubscribeToken('')).toBeNull();
  });

  it('is bound to the secret: rotating it invalidates old tokens', () => {
    const t = signUnsubscribeToken(USER)!;
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'a-different-secret');
    expect(verifyUnsubscribeToken(t)).toBeNull();
  });

  it('is not minted at all without a secret or an absolute site URL', () => {
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', '');
    vi.stubEnv('CRON_SECRET', '');
    expect(signUnsubscribeToken(USER)).toBeNull();
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'x');
    expect(unsubscribeUrl(USER, '/relative')).toBeNull();
    expect(unsubscribeUrl(USER, '')).toBeNull();
  });
});

describe('GET (the link in the email body)', () => {
  it('never opts anyone out — link scanners GET every URL in a message', async () => {
    const res = await GET(new Request(url()));
    expect(res.status).toBe(200);
    expect(m.updateMany).not.toHaveBeenCalled();
    const html = await res.text();
    expect(html).toContain('<form method="post"');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
  });

  it('answers a bad token with 400 and no form', async () => {
    const res = await GET(new Request(url('garbage')));
    expect(res.status).toBe(400);
    expect(await res.text()).not.toContain('<form');
  });
});

describe('POST (RFC 8058 one-click, and the confirm button)', () => {
  const post = (u: string) =>
    POST(
      new Request(u, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'List-Unsubscribe=One-Click',
      }),
    );

  it('switches the digest OFF for exactly the token’s user, and audits it', async () => {
    const res = await post(url());
    expect(res.status).toBe(200);
    expect(m.updateMany).toHaveBeenCalledWith({
      where: { id: USER, digestOptIn: true },
      data: { digestOptIn: false },
    });
    expect(m.auditCreate.mock.calls[0]![0].data).toMatchObject({
      actorId: USER,
      action: 'CONSENT_UPDATED',
      after: { digestOptIn: false, via: 'one-click' },
    });
  });

  it('can only ever switch OFF — there is no path from a token to opt-in', async () => {
    await post(url());
    const { data } = m.updateMany.mock.calls[0]![0];
    expect(data.digestOptIn).toBe(false);
  });

  it('is idempotent for someone already unsubscribed', async () => {
    m.updateMany.mockResolvedValue({ count: 0 });
    const res = await post(url());
    expect(res.status).toBe(200);
    expect(m.auditCreate).not.toHaveBeenCalled();
  });

  it('rejects a forged token', async () => {
    const res = await post(url(`${USER}.AAAA`));
    expect(res.status).toBe(400);
    expect(m.updateMany).not.toHaveBeenCalled();
  });

  it('is rate limited per caller', async () => {
    m.limit.mockResolvedValue({ success: false });
    const res = await post(url());
    expect(res.status).toBe(429);
    expect(m.updateMany).not.toHaveBeenCalled();
  });
});
