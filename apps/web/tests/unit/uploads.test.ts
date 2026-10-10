import { describe, it, expect, vi, beforeEach } from 'vitest';

// Résumé / logo registration. The security properties under test:
//   - the client NAMES an object, it never describes one: URL, content type and
//     size persisted come from the store, not from the request;
//   - a URL that is not in our store (any host, path-prefix tricks, data:) is
//     refused before anything is written or fetched;
//   - production never falls back to inline data: storage.

const m = vi.hoisted(() => {
  class AuthError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.name = 'AuthError';
      this.code = code;
    }
  }
  return {
    AuthError,
    requireRole: vi.fn(),
    resumeCreate: vi.fn(),
    resumeCount: vi.fn(),
    resumeFindFirst: vi.fn(),
    resumeDelete: vi.fn(),
    resumeUpdate: vi.fn(),
    appCount: vi.fn(),
    companyFindUnique: vi.fn(),
    companyUpdateMany: vi.fn(),
    verifyStoredBlob: vi.fn(),
    putStored: vi.fn(),
    deleteStored: vi.fn(),
    storeConfigured: vi.fn(),
    runResumeParse: vi.fn(),
  };
});

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole, AuthError: m.AuthError }));
vi.mock('@/lib/db', () => ({
  db: {
    resume: {
      create: m.resumeCreate,
      count: m.resumeCount,
      findFirst: m.resumeFindFirst,
      delete: m.resumeDelete,
      update: m.resumeUpdate,
    },
    jobApplication: { count: m.appCount },
    companyProfile: { findUnique: m.companyFindUnique, updateMany: m.companyUpdateMany },
  },
}));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({ resume: { create: m.resumeCreate } }),
}));
vi.mock('@/lib/storage/blob', () => ({
  RESUME_MIME: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  IMAGE_MIME: ['image/png', 'image/jpeg', 'image/webp'],
  RESUME_MAX_BYTES: 5 * 1024 * 1024,
  LOGO_MAX_BYTES: 2 * 1024 * 1024,
  MAX_ACTIVE_RESUMES: 10,
  resumePathPrefix: (id: string) => `resumes/${id}/`,
  logoPathPrefix: (id: string) => `logos/${id}/`,
  verifyStoredBlob: m.verifyStoredBlob,
  putStored: m.putStored,
  deleteStored: m.deleteStored,
  storeConfigured: m.storeConfigured,
}));

vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/server', () => ({
  after: (fn: () => unknown) => {
    void fn();
  },
}));
vi.mock('@/workflows/resume-parse.workflow', () => ({ runResumeParse: m.runResumeParse }));
vi.mock('@/lib/observability/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  uploadResumeDirect,
  uploadLogoDirect,
  registerResume,
  deleteResume,
} from '@/app/actions/uploads';

const PDF_URL = 'https://s1.private.blob.vercel-storage.com/resumes/seeker-123/cv-ab12.pdf';

const STORE_BLOB = {
  url: PDF_URL,
  pathname: 'resumes/seeker-123/cv-ab12.pdf',
  contentType: 'application/pdf',
  size: 120_000,
};

function pdfFile(name = 'cv.pdf', pad = 0): File {
  const body = `%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF${' '.repeat(pad)}`;
  return new File([body], name, { type: 'application/pdf' });
}

function pngFile(name = 'logo.png'): File {
  const sig = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Uint8Array.from([
    0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 0x1f, 0x15, 0xc4,
    0x89,
  ]);
  return new File([sig, ihdr], name, { type: 'image/png' });
}

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ id: 'seeker-123', userType: 'JOB_SEEKER' });
  m.resumeCount.mockResolvedValue(0);
  m.resumeCreate.mockImplementation(({ data }: { data: { title: string } }) =>
    Promise.resolve({ id: 'res-1', title: data.title, createdAt: new Date('2026-10-10') }),
  );
  m.verifyStoredBlob.mockResolvedValue(STORE_BLOB);
  m.putStored.mockResolvedValue({ url: PDF_URL, pathname: STORE_BLOB.pathname });
  m.deleteStored.mockResolvedValue('deleted');
  m.storeConfigured.mockReturnValue(true);
  m.companyFindUnique.mockResolvedValue({ logoUrl: null });
  m.companyUpdateMany.mockResolvedValue({ count: 1 });
});

describe('registerResume', () => {
  it('asks the store about the object, in the private store, under the caller’s own prefix', async () => {
    await registerResume({ url: PDF_URL, title: 'cv.pdf' });
    expect(m.verifyStoredBlob).toHaveBeenCalledWith(PDF_URL, 'private', 'resumes/seeker-123/');
  });

  it('refuses a URL the store does not vouch for (foreign host, other user, forged path)', async () => {
    m.verifyStoredBlob.mockResolvedValue(null);
    for (const url of [
      'https://attacker.example/resumes/seeker-123/cv.pdf', // right prefix, wrong host
      'https://s1.private.blob.vercel-storage.com/resumes/other-user/cv.pdf',
      'https://s1.private.blob.vercel-storage.com/resumes/seeker-123/../other/cv.pdf',
    ]) {
      await expect(registerResume({ url, title: 'x.pdf' })).rejects.toThrow();
    }
    expect(m.resumeCreate).not.toHaveBeenCalled();
  });

  it('rejects inline data: URLs outright — they are not a storage mechanism', async () => {
    m.verifyStoredBlob.mockResolvedValue(null); // the real verifier cannot resolve data:
    await expect(
      registerResume({ url: 'data:application/pdf;base64,JVBERi0xLjQK', title: 'x.pdf' }),
    ).rejects.toThrow();
    expect(m.resumeCreate).not.toHaveBeenCalled();
  });

  it('persists the STORE’s url, type and size — not what the client claimed', async () => {
    await registerResume({
      url: PDF_URL,
      title: 'cv.pdf',
      // lies:
      contentType: 'application/x-msdownload',
      sizeBytes: 1,
    } as never);
    const data = m.resumeCreate.mock.calls[0]![0].data;
    expect(data.fileBlobUrl).toBe(STORE_BLOB.url);
    expect(data.fileMime).toBe('application/pdf');
    expect(data.fileSizeBytes).toBe(120_000);
  });

  it('removes (not just refuses) an object of a disallowed type', async () => {
    m.verifyStoredBlob.mockResolvedValue({ ...STORE_BLOB, contentType: 'text/html' });
    await expect(registerResume({ url: PDF_URL, title: 'x.pdf' })).rejects.toThrow();
    expect(m.deleteStored).toHaveBeenCalledWith(PDF_URL, 'private');
    expect(m.resumeCreate).not.toHaveBeenCalled();
  });

  it('removes an oversized object', async () => {
    m.verifyStoredBlob.mockResolvedValue({ ...STORE_BLOB, size: 6 * 1024 * 1024 });
    await expect(registerResume({ url: PDF_URL, title: 'x.pdf' })).rejects.toThrow();
    expect(m.deleteStored).toHaveBeenCalled();
  });

  it('enforces the per-account résumé quota', async () => {
    m.resumeCount.mockResolvedValue(10);
    await expect(registerResume({ url: PDF_URL, title: 'x.pdf' })).rejects.toThrow(/up to 10/);
    expect(m.deleteStored).toHaveBeenCalled();
  });

  it('schedules the parse off the response path', async () => {
    await registerResume({ url: PDF_URL, title: 'cv.pdf' });
    expect(m.runResumeParse).toHaveBeenCalledWith({ resumeId: 'res-1' });
  });
});

describe('uploadResumeDirect', () => {
  it('rejects when no file is provided', async () => {
    const result = await uploadResumeDirect(new FormData());
    expect(result.ok).toBe(false);
  });

  it('rejects files larger than 5MB', async () => {
    const fd = new FormData();
    fd.set('file', pdfFile('big.pdf', 5 * 1024 * 1024 + 1));
    const result = await uploadResumeDirect(fd);
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/5MB/) });
  });

  it('rejects by CONTENT, not by name or declared type (an .exe renamed .pdf)', async () => {
    const fd = new FormData();
    fd.set(
      'file',
      new File([Uint8Array.from([0x4d, 0x5a, 0x90, 0x00, 0x03])], 'cv.pdf', {
        type: 'application/pdf',
      }),
    );
    const result = await uploadResumeDirect(fd);
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/Unsupported file type/),
    });
    expect(m.putStored).not.toHaveBeenCalled();
  });

  it('stores a valid PDF in the PRIVATE store and never returns the storage locator', async () => {
    const fd = new FormData();
    fd.set('file', pdfFile());
    const result = await uploadResumeDirect(fd);
    expect(result.ok).toBe(true);
    const [kind, pathname, , mime] = m.putStored.mock.calls[0]!;
    expect(kind).toBe('private');
    expect(pathname).toMatch(/^resumes\/seeker-123\//);
    expect(mime).toBe('application/pdf');
    if (result.ok) expect(result.data).not.toHaveProperty('fileBlobUrl');
  });

  it('answers a storage failure with an expected-failure result, and no inline fallback', async () => {
    m.putStored.mockRejectedValue(new Error('store down'));
    const fd = new FormData();
    fd.set('file', pdfFile());
    const result = await uploadResumeDirect(fd);
    expect(result).toMatchObject({ ok: false });
    expect(m.resumeCreate).not.toHaveBeenCalled();
  });

  it('in production with no store configured: refuses, rather than writing base64 into Postgres', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    m.storeConfigured.mockReturnValue(false);
    const { uploadResumeDirect: prodUpload } = await import('@/app/actions/uploads');
    const fd = new FormData();
    fd.set('file', pdfFile());
    const result = await prodUpload(fd);
    expect(result).toMatchObject({ ok: false });
    expect(m.resumeCreate).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('enforces the per-account résumé quota', async () => {
    m.resumeCount.mockResolvedValue(10);
    const fd = new FormData();
    fd.set('file', pdfFile());
    const result = await uploadResumeDirect(fd);
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/up to 10/) });
  });
});

describe('deleteResume', () => {
  beforeEach(() => {
    m.resumeFindFirst.mockResolvedValue({ id: 'res-1', fileBlobUrl: PDF_URL });
  });

  it('erases row AND file when no application references the résumé', async () => {
    m.appCount.mockResolvedValue(0);
    await deleteResume('res-1');
    expect(m.resumeDelete).toHaveBeenCalledWith({ where: { id: 'res-1' } });
    expect(m.deleteStored).toHaveBeenCalledWith(PDF_URL, 'private');
    expect(m.resumeUpdate).not.toHaveBeenCalled();
  });

  it('only hides it from the owner when an employer already received it', async () => {
    m.appCount.mockResolvedValue(2);
    await deleteResume('res-1');
    expect(m.resumeUpdate).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: { deletedAt: expect.any(Date) },
    });
    expect(m.resumeDelete).not.toHaveBeenCalled();
    expect(m.deleteStored).not.toHaveBeenCalled();
  });

  it("refuses someone else's résumé", async () => {
    m.resumeFindFirst.mockResolvedValue(null);
    await expect(deleteResume('res-9')).rejects.toThrow();
  });
});

describe('uploadLogoDirect', () => {
  beforeEach(() => {
    m.requireRole.mockResolvedValue({ id: 'company-1', userType: 'COMPANY' });
  });

  it('rejects logos larger than 2MB', async () => {
    const fd = new FormData();
    fd.set(
      'file',
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }),
    );
    const result = await uploadLogoDirect(fd);
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/2MB/) });
  });

  it('rejects non-images by content', async () => {
    const fd = new FormData();
    fd.set('file', pdfFile('logo.png'));
    const result = await uploadLogoDirect(fd);
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/PNG, JPEG, or WebP/) });
  });

  it('stores a PNG in the PUBLIC store and deletes the logo it replaces', async () => {
    const OLD = 'https://p1.public.blob.vercel-storage.com/logos/company-1/old.png';
    const NEW = 'https://p1.public.blob.vercel-storage.com/logos/company-1/new-xy.png';
    m.companyFindUnique.mockResolvedValue({ logoUrl: OLD });
    m.putStored.mockResolvedValue({ url: NEW, pathname: 'logos/company-1/new-xy.png' });
    const fd = new FormData();
    fd.set('file', pngFile());
    const result = await uploadLogoDirect(fd);
    expect(result).toEqual({ ok: true, data: NEW });
    expect(m.putStored.mock.calls[0]![0]).toBe('public');
    expect(m.companyUpdateMany).toHaveBeenCalledWith({
      where: { userId: 'company-1' },
      data: { logoUrl: NEW },
    });
    expect(m.deleteStored).toHaveBeenCalledWith(OLD, 'public');
  });
});
