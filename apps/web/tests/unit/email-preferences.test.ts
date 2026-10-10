import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({ requireRole: vi.fn(), update: vi.fn(), ctx: vi.fn() }));
vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole }));
vi.mock('@/lib/audit', () => ({
  withAudit: (ctx: unknown, meta: unknown, fn: (tx: unknown) => unknown) => {
    m.ctx(ctx, meta);
    return fn({ user: { update: m.update } });
  },
}));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn() } }));

import { setDigestOptIn } from '@/app/actions/email-preferences';

const USER = { id: 'u1', digestOptIn: false, emailSuppressedAt: null };

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ ...USER });
  m.update.mockResolvedValue({});
});

describe('setDigestOptIn', () => {
  it('records consent with a timestamp, and audits who/what/how', async () => {
    const res = await setDigestOptIn(true);
    expect(res).toEqual({ ok: true, data: true });
    expect(m.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { digestOptIn: true, digestOptInAt: expect.any(Date) },
    });
    expect(m.ctx.mock.calls[0]![1]).toMatchObject({
      action: 'CONSENT_UPDATED',
      before: { digestOptIn: false },
    });
  });

  it('withdrawing clears the consent timestamp', async () => {
    m.requireRole.mockResolvedValue({ ...USER, digestOptIn: true });
    await setDigestOptIn(false);
    expect(m.update.mock.calls[0]![0].data).toEqual({ digestOptIn: false, digestOptInAt: null });
  });

  it('refuses to "enable" mail to an address that bounced or complained, and says why', async () => {
    m.requireRole.mockResolvedValue({ ...USER, emailSuppressedAt: new Date() });
    const res = await setDigestOptIn(true);
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/bounced|spam/) });
    expect(m.update).not.toHaveBeenCalled();
  });

  it('still lets a suppressed address be switched OFF', async () => {
    m.requireRole.mockResolvedValue({ ...USER, digestOptIn: true, emailSuppressedAt: new Date() });
    expect(await setDigestOptIn(false)).toEqual({ ok: true, data: false });
  });

  it('is a no-op (and writes nothing) when the value is unchanged', async () => {
    expect(await setDigestOptIn(false)).toEqual({ ok: true, data: false });
    expect(m.update).not.toHaveBeenCalled();
  });

  it('rejects a non-boolean from a hand-crafted request', async () => {
    const res = await setDigestOptIn('yes' as unknown as boolean);
    expect(res.ok).toBe(false);
    expect(m.update).not.toHaveBeenCalled();
  });
});
