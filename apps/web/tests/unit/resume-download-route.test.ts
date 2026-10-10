import { vi, describe, it, expect, beforeEach } from 'vitest';

// Who may read a résumé. A storage URL opens nothing (private store); this
// route is where the decision is made, so every denial path is tested.

const m = vi.hoisted(() => ({
  currentUser: vi.fn(),
  limit: vi.fn(),
  resumeFindUnique: vi.fn(),
  appFindFirst: vi.fn(),
  openBlobStream: vi.fn(),
  readBlobBytes: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ currentUser: m.currentUser }));
vi.mock('@/lib/ratelimit', () => ({ resumeDownloadLimit: m.limit }));
vi.mock('@/lib/db', () => ({
  db: {
    resume: { findUnique: m.resumeFindUnique },
    jobApplication: { findFirst: m.appFindFirst },
  },
}));
vi.mock('@/lib/storage/blob', () => ({
  RESUME_MIME: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  openBlobStream: m.openBlobStream,
  readBlobBytes: m.readBlobBytes,
}));
vi.mock('@/lib/observability/logger', () => ({ logger: { error: vi.fn(), info: vi.fn() } }));

import { GET } from '@/app/api/v1/resumes/[id]/file/route';

const RID = '11111111-1111-4111-8111-111111111111';
const params = { params: Promise.resolve({ id: RID }) };
const req = () => new Request(`http://t/api/v1/resumes/${RID}/file`);

const RESUME = {
  id: RID,
  userId: 'owner',
  title: 'Jane “CV”.pdf',
  fileBlobUrl: 'https://s.private.blob.vercel-storage.com/resumes/owner/cv-ab.pdf',
  fileMime: 'application/pdf',
  deletedAt: null as Date | null,
};

beforeEach(() => {
  vi.clearAllMocks();
  m.limit.mockResolvedValue({ success: true });
  m.resumeFindUnique.mockResolvedValue({ ...RESUME });
  m.appFindFirst.mockResolvedValue(null);
  m.openBlobStream.mockResolvedValue({
    stream: new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode('%PDF-1.4'));
        c.close();
      },
    }),
    contentType: 'application/pdf',
  });
});

describe('GET /api/v1/resumes/[id]/file', () => {
  it('401s an anonymous caller', async () => {
    m.currentUser.mockResolvedValue(null);
    expect((await GET(req(), params)).status).toBe(401);
    expect(m.resumeFindUnique).not.toHaveBeenCalled();
  });

  it('serves the owner — as a download, never inline', async () => {
    m.currentUser.mockResolvedValue({ id: 'owner', userType: 'JOB_SEEKER' });
    const res = await GET(req(), params);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('%PDF-1.4');
    expect(res.headers.get('content-disposition')).toMatch(/^attachment; filename="/);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(res.headers.get('content-security-policy')).toContain('sandbox');
  });

  it('hides a résumé from its owner once they deleted it', async () => {
    m.currentUser.mockResolvedValue({ id: 'owner', userType: 'JOB_SEEKER' });
    m.resumeFindUnique.mockResolvedValue({ ...RESUME, deletedAt: new Date() });
    expect((await GET(req(), params)).status).toBe(404);
  });

  it('serves a company that received it with a live application', async () => {
    m.currentUser.mockResolvedValue({ id: 'company-1', userType: 'COMPANY' });
    m.appFindFirst.mockResolvedValue({ id: 'app-1' });
    expect((await GET(req(), params)).status).toBe(200);
    expect(m.appFindFirst).toHaveBeenCalledWith({
      where: {
        resumeId: RID,
        status: { not: 'WITHDRAWN' },
        jobPost: { companyId: 'company-1' },
      },
      select: { id: true },
    });
  });

  it('still serves the company a résumé the owner has since deleted (they received that copy)', async () => {
    m.currentUser.mockResolvedValue({ id: 'company-1', userType: 'COMPANY' });
    m.resumeFindUnique.mockResolvedValue({ ...RESUME, deletedAt: new Date() });
    m.appFindFirst.mockResolvedValue({ id: 'app-1' });
    expect((await GET(req(), params)).status).toBe(200);
  });

  it.each([
    ['another company with no application', { id: 'company-2', userType: 'COMPANY' }],
    ['another job seeker', { id: 'seeker-2', userType: 'JOB_SEEKER' }],
    [
      'an admin (the verification queue never needs a candidate’s document)',
      { id: 'a1', userType: 'ADMIN' },
    ],
  ])('404s %s — and does not reveal that the id exists', async (_label, user) => {
    m.currentUser.mockResolvedValue(user);
    const res = await GET(req(), params);
    expect(res.status).toBe(404);
    expect(m.openBlobStream).not.toHaveBeenCalled();
  });

  it('404s a malformed id without touching the database', async () => {
    m.currentUser.mockResolvedValue({ id: 'owner', userType: 'JOB_SEEKER' });
    const res = await GET(req(), { params: Promise.resolve({ id: '../../etc/passwd' }) });
    expect(res.status).toBe(404);
    expect(m.resumeFindUnique).not.toHaveBeenCalled();
  });

  it('is rate limited', async () => {
    m.currentUser.mockResolvedValue({ id: 'owner', userType: 'JOB_SEEKER' });
    m.limit.mockResolvedValue({ success: false });
    expect((await GET(req(), params)).status).toBe(429);
  });

  it('never reflects a stored content type outside the allow-list', async () => {
    m.currentUser.mockResolvedValue({ id: 'owner', userType: 'JOB_SEEKER' });
    m.resumeFindUnique.mockResolvedValue({ ...RESUME, fileMime: 'text/html' });
    const res = await GET(req(), params);
    expect(res.headers.get('content-type')).toBe('application/octet-stream');
  });

  it('cannot be header-injected through the title', async () => {
    m.currentUser.mockResolvedValue({ id: 'owner', userType: 'JOB_SEEKER' });
    m.resumeFindUnique.mockResolvedValue({ ...RESUME, title: 'x"\r\nSet-Cookie: pwn=1' });
    const res = await GET(req(), params);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(res.headers.get('content-disposition')).not.toMatch(/[\r\n]/);
  });
});
