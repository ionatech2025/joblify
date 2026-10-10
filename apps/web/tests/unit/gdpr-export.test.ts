import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  auditFindMany: vi.fn(),
  auditCreate: vi.fn(),
  chatFindMany: vi.fn(),
  viewFindMany: vi.fn(),
  put: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: m.userFindUnique },
    auditEvent: { findMany: m.auditFindMany, create: m.auditCreate },
    chatMessage: { findMany: m.chatFindMany },
    jobView: { findMany: m.viewFindMany },
  },
}));
// The export must not touch storage at all.
vi.mock('@vercel/blob', () => ({ put: m.put }));

import { buildGdprExport } from '@/workflows/gdpr-export.workflow';

beforeEach(() => {
  vi.clearAllMocks();
  m.userFindUnique.mockResolvedValue({
    id: 'u1',
    email: 'ada@x.test',
    firstName: 'Ada',
    clerkUserId: 'user_1',
    jobSeekerProfile: { headline: 'Eng', workExperiences: [{ company: 'Acme', title: 'Eng' }] },
    companyProfile: null,
    jobsPosted: [],
    applications: [{ id: 'a1', recruiterNotes: 'strong', matchScore: 0.8 }],
    resumes: [
      {
        id: 'r1',
        title: 'cv.pdf',
        fileBlobUrl: 'https://s.private.blob.vercel-storage.com/resumes/u1/cv.pdf',
        parsedJson: { skills: ['Rust'] },
      },
    ],
    notifications: [],
    invitationsSent: [],
    invitationsRecv: [],
    savedJobs: [{ id: 'sj1' }],
    savedSearches: [{ id: 'ss1', query: 'q=rust' }],
    subscriptions: [],
    chatMemberships: [],
  });
  m.auditFindMany.mockResolvedValue([{ id: 'ae1', action: 'USER_SIGNED_IN' }]);
  m.chatFindMany.mockResolvedValue([{ id: 'cm1', body: 'hello', chatAreaId: 'ca1' }]);
  m.viewFindMany.mockResolvedValue([{ id: 'v1', jobPostId: 'j1' }]);
  m.auditCreate.mockResolvedValue({});
});

describe('buildGdprExport', () => {
  it('is returned to the caller — never written to storage (no link to leak)', async () => {
    const out = await buildGdprExport({ userId: 'u1' });
    expect(m.put).not.toHaveBeenCalled();
    expect(out.filename).toMatch(/^joblify-data-export-\d{4}-\d{2}-\d{2}\.json$/);
    expect(() => JSON.parse(out.json)).not.toThrow();
  });

  it('covers what the previous export omitted: work history, chat, saved items, views', async () => {
    const data = JSON.parse((await buildGdprExport({ userId: 'u1' })).json);
    expect(data.user.jobSeekerProfile.workExperiences).toHaveLength(1);
    expect(data.chatMessagesSent).toHaveLength(1);
    expect(data.user.savedJobs).toHaveLength(1);
    expect(data.user.savedSearches).toHaveLength(1);
    expect(data.jobViews).toHaveLength(1);
    expect(data.auditEvents).toHaveLength(1);
  });

  it('includes recruiter notes and the match score — data about the requester', async () => {
    const data = JSON.parse((await buildGdprExport({ userId: 'u1' })).json);
    expect(data.user.applications[0]).toMatchObject({ recruiterNotes: 'strong', matchScore: 0.8 });
  });

  it('replaces internal storage locators with the authenticated path', async () => {
    const json = (await buildGdprExport({ userId: 'u1' })).json;
    expect(json).not.toContain('blob.vercel-storage.com');
    expect(JSON.parse(json).user.resumes[0].downloadPath).toBe('/api/v1/resumes/r1/file');
  });

  it('describes the processing, including the automated parts (Art. 15(1))', async () => {
    const data = JSON.parse((await buildGdprExport({ userId: 'u1' })).json);
    expect(data.processing.automatedProcessing.map((a: { name: string }) => a.name)).toEqual([
      'Résumé parsing',
      'Match score',
    ]);
    expect(data.processing.retention.auditLog).toMatch(/90 days.*1 year/);
  });

  it('scopes to the requester — it never queries other people’s applicants', async () => {
    await buildGdprExport({ userId: 'u1' });
    const include = m.userFindUnique.mock.calls[0]![0].include;
    expect(include.jobsPosted).toBe(true);
    expect(include.jobsPosted).not.toHaveProperty('include'); // postings, not their applicants
    expect(m.auditFindMany.mock.calls[0]![0].where).toEqual({ actorId: 'u1' });
    expect(m.chatFindMany.mock.calls[0]![0].where).toEqual({ senderId: 'u1' });
  });

  it('audits the export', async () => {
    await buildGdprExport({ userId: 'u1' });
    expect(m.auditCreate.mock.calls[0]![0].data).toMatchObject({
      action: 'USER_EXPORTED',
      actorId: 'u1',
    });
  });

  it('throws for an unknown user', async () => {
    m.userFindUnique.mockResolvedValue(null);
    await expect(buildGdprExport({ userId: 'ghost' })).rejects.toThrow(/not found/);
  });
});
