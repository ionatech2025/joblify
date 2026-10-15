import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  currentUser: vi.fn(),
  appFindMany: vi.fn(),
  notifFindMany: vi.fn(),
  notifUpdateMany: vi.fn(),
  userUpdate: vi.fn(),
  uploadSignLimit: vi.fn(),
  handleUpload: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ currentUser: m.currentUser }));
vi.mock('@/lib/db', () => ({
  db: {
    jobApplication: { findMany: m.appFindMany },
    notification: { findMany: m.notifFindMany, updateMany: m.notifUpdateMany },
    user: { update: m.userUpdate },
  },
}));
vi.mock('@/lib/ratelimit', () => ({ uploadSignLimit: m.uploadSignLimit }));
vi.mock('@vercel/blob/client', () => ({ handleUpload: m.handleUpload }));
vi.mock('@/lib/observability/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { GET as getApplications } from '@/app/api/v1/applications/route';
import { GET as getNotifications } from '@/app/api/v1/notifications/route';
import { POST as markNotificationRead } from '@/app/api/v1/notifications/[id]/read/route';
import { POST as postConsent } from '@/app/api/v1/consent/route';
import { POST as postUploadSign } from '@/app/api/v1/uploads/sign/route';

beforeEach(() => {
  vi.clearAllMocks();
  m.currentUser.mockResolvedValue({ id: 'user-1', userType: 'JOB_SEEKER' });
  m.appFindMany.mockResolvedValue([]);
  m.notifFindMany.mockResolvedValue([]);
  m.notifUpdateMany.mockResolvedValue({ count: 1 });
  m.userUpdate.mockResolvedValue({});
  m.uploadSignLimit.mockResolvedValue({ success: true });
});

describe('GET /api/v1/applications', () => {
  it('returns 401 when unauthenticated or not a jobseeker', async () => {
    m.currentUser.mockResolvedValueOnce(null);
    expect((await getApplications()).status).toBe(401);

    m.currentUser.mockResolvedValueOnce({ id: 'comp-1', userType: 'COMPANY' });
    expect((await getApplications()).status).toBe(401);
  });

  it('returns the seeker applications with Cache-Control: private, no-store', async () => {
    m.appFindMany.mockResolvedValue([
      {
        id: 'app-1',
        jobPostId: 'job-1',
        status: 'SHORTLISTED',
        appliedAt: new Date('2026-10-10T12:00:00Z'),
        matchScore: 0.85,
        jobPost: {
          slug: 'rust-eng',
          title: 'Rust Engineer',
          company: { companyProfile: { companyName: 'Acme' } },
        },
      },
    ]);
    const res = await getApplications();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    await expect(res.json()).resolves.toEqual([
      {
        id: 'app-1',
        jobPostId: 'job-1',
        slug: 'rust-eng',
        jobTitle: 'Rust Engineer',
        companyName: 'Acme',
        status: 'SHORTLISTED',
        appliedAt: '2026-10-10T12:00:00.000Z',
        matchScore: 0.85,
      },
    ]);
  });
});

describe('GET /api/v1/notifications and POST /api/v1/notifications/[id]/read', () => {
  it('returns 401 when unauthenticated and serves private, no-store when signed in', async () => {
    m.currentUser.mockResolvedValueOnce(null);
    expect((await getNotifications()).status).toBe(401);

    m.notifFindMany.mockResolvedValue([
      {
        id: 'n-1',
        kind: 'SYSTEM',
        payload: { message: 'Hello' },
        readAt: null,
        createdAt: new Date('2026-10-10T12:00:00Z'),
      },
    ]);
    const res = await getNotifications();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    await expect(res.json()).resolves.toHaveLength(1);
  });

  it('marks a notification read scoped to the authenticated user', async () => {
    const res = await markNotificationRead(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'n-1' }),
    });
    expect(res.status).toBe(200);
    expect(m.notifUpdateMany).toHaveBeenCalledWith({
      where: { id: 'n-1', userId: 'user-1', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });
});

describe('POST /api/v1/consent', () => {
  it('rejects malformed payloads with 400 and mirrors valid consent when signed in', async () => {
    const bad = await postConsent(
      new Request('http://localhost/api/v1/consent', {
        method: 'POST',
        body: JSON.stringify({ analytics: 'yes' }),
      }),
    );
    expect(bad.status).toBe(400);

    const good = await postConsent(
      new Request('http://localhost/api/v1/consent', {
        method: 'POST',
        body: JSON.stringify({ analytics: true }),
      }),
    );
    expect(good.status).toBe(200);
    expect(m.userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        consentJson: expect.objectContaining({ analytics: true, marketing: false }),
      },
    });
  });
});

describe('POST /api/v1/uploads/sign', () => {
  it('enforces auth, rate limit, and path-prefix tenancy when signing a resume upload', async () => {
    m.currentUser.mockResolvedValueOnce(null);
    expect(
      (await postUploadSign(new Request('http://localhost', { method: 'POST', body: '{}' })))
        .status,
    ).toBe(401);

    m.uploadSignLimit.mockResolvedValueOnce({ success: false });
    expect(
      (await postUploadSign(new Request('http://localhost', { method: 'POST', body: '{}' })))
        .status,
    ).toBe(429);

    m.handleUpload.mockImplementation(
      async ({
        onBeforeGenerateToken,
      }: {
        onBeforeGenerateToken: (p: string) => Promise<unknown>;
      }) => {
        // Attempt path traversal outside user's namespace
        await onBeforeGenerateToken('resumes/user-1/../other/cv.pdf');
      },
    );
    const traversal = await postUploadSign(
      new Request('http://localhost', {
        method: 'POST',
        body: '{"type":"blob.generate-client-token"}',
      }),
    );
    expect(traversal.status).toBe(400);

    m.handleUpload.mockImplementation(
      async ({
        onBeforeGenerateToken,
      }: {
        onBeforeGenerateToken: (p: string) => Promise<unknown>;
      }) => {
        const tokenSpec = await onBeforeGenerateToken('resumes/user-1/cv.pdf');
        return { clientToken: 'tok', tokenSpec };
      },
    );
    const ok = await postUploadSign(
      new Request('http://localhost', {
        method: 'POST',
        body: '{"type":"blob.generate-client-token"}',
      }),
    );
    expect(ok.status).toBe(200);
  });
});
