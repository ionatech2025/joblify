import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  verify: vi.fn(),
  upsert: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock('svix', () => ({ Webhook: vi.fn().mockImplementation(() => ({ verify: m.verify })) }));
vi.mock('@/lib/db', () => ({
  db: { user: { upsert: m.upsert, updateMany: m.updateMany } },
}));
vi.mock('@/lib/observability/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
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

import { POST } from '@/app/api/v1/webhooks/clerk/route';

function req() {
  return new Request('http://x/api/v1/webhooks/clerk', { method: 'POST', body: '{}' });
}

function emailAddress(id: string, email_address: string) {
  return { id, email_address, object: 'email_address', verification: null, linked_to: [] };
}

describe('clerk webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test';
    m.upsert.mockResolvedValue({});
    m.updateMany.mockResolvedValue({ count: 1 });
  });

  describe('user.created / user.updated', () => {
    it('mirrors the primary email, not array index 0', async () => {
      // A linked second address sits first in the array — array order isn't
      // guaranteed to match the primary, only primary_email_address_id does.
      m.verify.mockReturnValue({
        type: 'user.created',
        data: {
          id: 'user_1',
          primary_email_address_id: 'ea_primary',
          email_addresses: [
            emailAddress('ea_secondary', 'secondary@x.com'),
            emailAddress('ea_primary', 'primary@x.com'),
          ],
          first_name: 'Ada',
          last_name: 'Lovelace',
          image_url: 'https://img/ada.png',
        },
      });
      const res = await POST(req());
      expect(res.status).toBe(200);
      const arg = m.upsert.mock.calls[0]![0];
      expect(arg.create.email).toBe('primary@x.com');
      expect(arg.update.email).toBe('primary@x.com');
    });

    it('falls back to the first address if primary_email_address_id matches none', async () => {
      m.verify.mockReturnValue({
        type: 'user.created',
        data: {
          id: 'user_2',
          primary_email_address_id: 'ea_missing',
          email_addresses: [emailAddress('ea_only', 'only@x.com')],
        },
      });
      await POST(req());
      expect(m.upsert.mock.calls[0]![0].create.email).toBe('only@x.com');
    });

    it('upserts keyed on clerkUserId with JOB_SEEKER as the default userType', async () => {
      m.verify.mockReturnValue({
        type: 'user.created',
        data: {
          id: 'user_3',
          primary_email_address_id: 'ea1',
          email_addresses: [emailAddress('ea1', 'new@x.com')],
        },
      });
      await POST(req());
      const arg = m.upsert.mock.calls[0]![0];
      expect(arg.where).toEqual({ clerkUserId: 'user_3' });
      expect(arg.create.userType).toBe('JOB_SEEKER');
    });

    it('skips the upsert when the user has no email address', async () => {
      m.verify.mockReturnValue({
        type: 'user.created',
        data: { id: 'user_4', primary_email_address_id: null, email_addresses: [] },
      });
      const res = await POST(req());
      expect(res.status).toBe(200);
      expect(m.upsert).not.toHaveBeenCalled();
    });
  });

  describe('user.deleted', () => {
    it('soft-deletes by clerkUserId', async () => {
      m.verify.mockReturnValue({ type: 'user.deleted', data: { id: 'user_5' } });
      await POST(req());
      const arg = m.updateMany.mock.calls[0]![0];
      expect(arg.where).toEqual({ clerkUserId: 'user_5' });
      expect(arg.data.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('organizationMembership.created', () => {
    it('flips the member to COMPANY', async () => {
      m.verify.mockReturnValue({
        type: 'organizationMembership.created',
        data: {
          organization: { id: 'org_1' },
          public_user_data: { user_id: 'user_6' },
        },
      });
      await POST(req());
      const arg = m.updateMany.mock.calls[0]![0];
      expect(arg.where).toEqual({ clerkUserId: 'user_6' });
      expect(arg.data.userType).toBe('COMPANY');
    });
  });

  describe('signature + config', () => {
    it('rejects an invalid signature with 400', async () => {
      m.verify.mockImplementation(() => {
        throw new Error('bad signature');
      });
      const res = await POST(req());
      expect(res.status).toBe(400);
      expect(m.upsert).not.toHaveBeenCalled();
    });

    it('returns 500 when the webhook secret is unset', async () => {
      delete process.env.CLERK_WEBHOOK_SECRET;
      const res = await POST(req());
      expect(res.status).toBe(500);
    });
  });
});
