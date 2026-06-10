import { vi, describe, it, expect, beforeEach } from 'vitest';

// Money path (AI differentiator): uploaded resume → magic-byte gate → text
// extraction → structured parse → embedding persisted → skills linked.

const m = vi.hoisted(() => ({
  resumeFindUnique: vi.fn(),
  resumeUpdate: vi.fn(),
  skillFindMany: vi.fn(),
  profileFindUnique: vi.fn(),
  skillUpsert: vi.fn(),
  executeRaw: vi.fn(),
  generateObject: vi.fn(),
  embed: vi.fn(),
  fileTypeFromBuffer: vi.fn(),
  pdfParse: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    resume: { findUnique: m.resumeFindUnique, update: m.resumeUpdate },
    skill: { findMany: m.skillFindMany },
    jobSeekerProfile: { findUnique: m.profileFindUnique },
    jobSeekerSkill: { upsert: m.skillUpsert },
    $executeRaw: m.executeRaw,
  },
}));
vi.mock('ai', () => ({ generateObject: m.generateObject, embed: m.embed }));
vi.mock('@/lib/ai/gateway', () => ({
  gateway: Object.assign(() => ({}), { textEmbeddingModel: () => ({}) }),
  MODELS: { haiku: 'h', embeddingLarge: 'e' },
}));
vi.mock('file-type', () => ({ fileTypeFromBuffer: m.fileTypeFromBuffer }));
vi.mock('pdf-parse', () => ({ default: m.pdfParse }));
vi.mock('@/lib/storage/blob', () => ({
  RESUME_MIME: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { runResumeParse } from '@/workflows/resume-parse.workflow';

const RESUME_ID = '44444444-4444-4444-4444-444444444444';

const RESUME = {
  id: RESUME_ID,
  userId: 'seeker1',
  fileBlobUrl: 'https://blob.test/resume.pdf',
  fileMime: 'application/pdf',
  parsedJson: null,
};

const PARSED = {
  summary: 'Senior Rust engineer with 8 years of systems experience.',
  skills: ['Rust', 'Docker'],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', m.fetch);
  m.resumeFindUnique.mockResolvedValue({ ...RESUME });
  m.fetch.mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(64) });
  m.fileTypeFromBuffer.mockResolvedValue({ mime: 'application/pdf' });
  m.pdfParse.mockResolvedValue({ text: 'Rust engineer. Built distributed systems. '.repeat(4) });
  m.generateObject.mockResolvedValue({ object: PARSED });
  m.embed.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] });
  m.resumeUpdate.mockResolvedValue({});
  m.executeRaw.mockResolvedValue(1);
  m.skillFindMany.mockResolvedValue([{ id: 's-rust', slug: 'rust' }]);
  m.profileFindUnique.mockResolvedValue({ id: 'profile1' });
  m.skillUpsert.mockResolvedValue({});
});

describe('runResumeParse', () => {
  it('throws when the resume row does not exist', async () => {
    m.resumeFindUnique.mockResolvedValue(null);
    await expect(runResumeParse({ resumeId: RESUME_ID })).rejects.toThrow(/not found/);
  });

  it('is idempotent — skips entirely when already parsed', async () => {
    m.resumeFindUnique.mockResolvedValue({ ...RESUME, parsedJson: { summary: 'done' } });
    await runResumeParse({ resumeId: RESUME_ID });
    expect(m.fetch).not.toHaveBeenCalled();
    expect(m.generateObject).not.toHaveBeenCalled();
  });

  it('rejects + soft-deletes the resume on a magic-byte mime mismatch', async () => {
    m.fileTypeFromBuffer.mockResolvedValue({ mime: 'image/png' }); // spoofed .pdf
    await expect(runResumeParse({ resumeId: RESUME_ID })).rejects.toThrow(/mime/i);
    const update = m.resumeUpdate.mock.calls[0]![0];
    expect(update.data.deletedAt).toBeInstanceOf(Date);
    expect(m.generateObject).not.toHaveBeenCalled(); // never reaches the model
  });

  it('throws when the blob download fails', async () => {
    m.fetch.mockResolvedValue({ ok: false, status: 403 });
    await expect(runResumeParse({ resumeId: RESUME_ID })).rejects.toThrow(/403/);
  });

  it('throws when the extracted text is too short to parse', async () => {
    m.pdfParse.mockResolvedValue({ text: 'hi' });
    await expect(runResumeParse({ resumeId: RESUME_ID })).rejects.toThrow(/too short/i);
    expect(m.generateObject).not.toHaveBeenCalled();
  });

  it('persists parsedJson + embedding and links catalog skills on the happy path', async () => {
    await runResumeParse({ resumeId: RESUME_ID });
    // structured parse persisted
    expect(m.resumeUpdate).toHaveBeenCalledWith({
      where: { id: RESUME_ID },
      data: { parsedJson: PARSED },
    });
    // embedding written via raw SQL (pgvector literal)
    expect(m.executeRaw).toHaveBeenCalledTimes(1);
    // skills matched against the catalog and linked to the profile
    expect(m.skillUpsert).toHaveBeenCalledTimes(1);
    expect(m.skillUpsert.mock.calls[0]![0].create).toMatchObject({
      jobSeekerProfileId: 'profile1',
      skillId: 's-rust',
    });
  });

  it('still completes when the seeker has no profile yet (skills skipped)', async () => {
    m.profileFindUnique.mockResolvedValue(null);
    await expect(runResumeParse({ resumeId: RESUME_ID })).resolves.toBeUndefined();
    expect(m.skillUpsert).not.toHaveBeenCalled();
    expect(m.resumeUpdate).toHaveBeenCalledTimes(1); // parse still persisted
  });
});
