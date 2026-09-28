import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadResumeDirect, uploadLogoDirect, registerResume } from '@/app/actions/uploads';

const m = vi.hoisted(() => ({
  requireRole: vi.fn(),
  resumeCreate: vi.fn(),
  companyProfileUpdateMany: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireRole: m.requireRole,
  AuthError: class extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    resume: { create: m.resumeCreate },
    companyProfile: { updateMany: m.companyProfileUpdateMany },
  },
}));

vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      resume: { create: m.resumeCreate },
    }),
}));

vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/server', () => ({ after: (fn: () => unknown) => { void fn(); } }));
vi.mock('@/workflows/resume-parse.workflow', () => ({ runResumeParse: vi.fn() }));
vi.mock('@/lib/observability/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('registerResume', () => {
  it('rejects URLs outside the user namespace', async () => {
    m.requireRole.mockResolvedValue({ id: 'seeker-123', userType: 'JOB_SEEKER' });
    await expect(
      registerResume({
        url: 'https://blob.vercel-storage.com/resumes/other-user/file.pdf',
        title: 'file.pdf',
      }),
    ).rejects.toThrow();
  });

  it('accepts data URLs for direct uploads', async () => {
    m.requireRole.mockResolvedValue({ id: 'seeker-123', userType: 'JOB_SEEKER' });
    const result = await registerResume({
      url: 'data:application/pdf;base64,JVBERi0xLjQK',
      title: 'direct.pdf',
    });
    expect(result.id).toBe('res-1');
  });
});

describe('uploadResumeDirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.requireRole.mockResolvedValue({ id: 'seeker-123', userType: 'JOB_SEEKER' });
    m.resumeCreate.mockImplementation(({ data }: { data: { title: string } }) =>
      Promise.resolve({
        id: 'res-1',
        title: data.title,
        fileBlobUrl: 'data:application/pdf;base64,JVBERi0xLjQK',
        createdAt: new Date('2026-09-28'),
      }),
    );
  });

  it('rejects when no file is provided', async () => {
    const fd = new FormData();
    const result = await uploadResumeDirect(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/No file was provided/i);
    }
  });

  it('rejects files larger than 5MB', async () => {
    const fd = new FormData();
    const largeContent = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
    fd.append('file', file);

    const result = await uploadResumeDirect(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/under 5MB/i);
    }
  });

  it('rejects unsupported file formats', async () => {
    const fd = new FormData();
    // Executable / invalid header bytes
    const invalidBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
    const file = new File([invalidBytes], 'bad.exe', { type: 'application/x-msdownload' });
    fd.append('file', file);

    const result = await uploadResumeDirect(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Unsupported file type/i);
    }
  });

  it('succeeds with a valid PDF and falls back to data URL when Vercel Blob is not configured', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const fd = new FormData();
    // Standard PDF header bytes (%PDF-1.4)
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]);
    const file = new File([pdfHeader], 'resume.pdf', { type: 'application/pdf' });
    fd.append('file', file);

    const result = await uploadResumeDirect(fd);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('res-1');
      expect(result.data.title).toBe('resume.pdf');
    }
  });
});

describe('uploadLogoDirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.requireRole.mockResolvedValue({ id: 'company-123', userType: 'COMPANY' });
    m.companyProfileUpdateMany.mockResolvedValue({ count: 1 });
  });

  it('rejects logos larger than 2MB', async () => {
    const fd = new FormData();
    const largeContent = new Uint8Array(2 * 1024 * 1024 + 1);
    const file = new File([largeContent], 'logo.png', { type: 'image/png' });
    fd.append('file', file);

    const result = await uploadLogoDirect(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/under 2MB/i);
    }
  });

  it('succeeds with a valid PNG image', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const fd = new FormData();
    // Valid 1x1 PNG bytes
    const pngBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    const file = new File([pngBytes], 'logo.png', { type: 'image/png' });
    fd.append('file', file);

    const result = await uploadLogoDirect(fd);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toContain('data:image/png;base64');
    }
  });
});
