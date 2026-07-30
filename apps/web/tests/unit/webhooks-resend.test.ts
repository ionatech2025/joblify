import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({ verify: vi.fn(), updateMany: vi.fn() }));

vi.mock('svix', () => ({ Webhook: vi.fn().mockImplementation(() => ({ verify: m.verify })) }));
vi.mock('@/lib/db', () => ({ db: { user: { updateMany: m.updateMany } } }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
vi.mock('next/headers', () => ({
  headers: async () =>
    new Map([
      ['svix-id', '1'],
      ['svix-timestamp', '2'],
      ['svix-signature', '3'],
    ]),
}));
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => new Response(JSON.stringify(body), init),
  },
}));

import { POST } from '@/app/api/v1/webhooks/resend/route';

function req() {
  return new Request('http://x/api/v1/webhooks/resend', { method: 'POST', body: '{}' });
}

describe('resend webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_test';
  });

  it('suppresses recipients on a hard bounce', async () => {
    m.verify.mockReturnValue({
      type: 'email.bounced',
      data: { email_id: 'e1', to: ['bounce@x.com'] },
    });
    m.updateMany.mockResolvedValue({ count: 1 });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(m.updateMany).toHaveBeenCalledTimes(1);
    const arg = m.updateMany.mock.calls[0]![0];
    expect(arg.where.email.in).toEqual(['bounce@x.com']);
    expect(arg.where.emailSuppressedAt).toBeNull(); // don't re-stamp already-suppressed
    expect(arg.data.emailSuppressedAt).toBeInstanceOf(Date);
    expect(arg.data.emailSuppressionReason).toBe('BOUNCED');
  });

  it('marks complaints with the COMPLAINED reason', async () => {
    m.verify.mockReturnValue({
      type: 'email.complained',
      data: { email_id: 'e3', to: ['spam@x.com'] },
    });
    m.updateMany.mockResolvedValue({ count: 1 });
    await POST(req());
    expect(m.updateMany.mock.calls[0]![0].data.emailSuppressionReason).toBe('COMPLAINED');
  });

  it('does not suppress on a delivered event', async () => {
    m.verify.mockReturnValue({
      type: 'email.delivered',
      data: { email_id: 'e2', to: ['ok@x.com'] },
    });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(m.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an invalid signature with 400', async () => {
    m.verify.mockImplementation(() => {
      throw new Error('bad signature');
    });
    const res = await POST(req());
    expect(res.status).toBe(400);
    expect(m.updateMany).not.toHaveBeenCalled();
  });

  it('returns 500 when the webhook secret is unset', async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    const res = await POST(req());
    expect(res.status).toBe(500);
  });
});
