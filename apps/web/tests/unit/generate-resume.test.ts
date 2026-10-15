import { vi, describe, it, expect, beforeEach } from 'vitest';

// Resume builder (JOB_UC_05.0): assembles profile + work experience + skills
// into a PDF, then stores it through the same Resume model as an upload so it
// shows up in "My resumes" without any separate list UI.

const m = vi.hoisted(() => {
  const afterCallbacks: Array<() => unknown> = [];
  return {
    afterCallbacks,
    after: vi.fn((fn: () => unknown) => {
      afterCallbacks.push(fn);
    }),
    requireRole: vi.fn(),
    profileFindUnique: vi.fn(),
    resumeCreate: vi.fn(),
    renderToBuffer: vi.fn(),
    putStored: vi.fn(),
    storeConfigured: vi.fn(),
    runResumeParse: vi.fn(),
  };
});

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole }));
vi.mock('@/lib/db', () => ({ db: { jobSeekerProfile: { findUnique: m.profileFindUnique } } }));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({ resume: { create: m.resumeCreate } }),
}));
vi.mock('@/lib/storage/blob', () => ({
  MAX_ACTIVE_RESUMES: 10,
  putStored: m.putStored,
  storeConfigured: m.storeConfigured,
  resumePathPrefix: (userId: string) => `resumes/${userId}/`,
}));
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: m.renderToBuffer,
  Document: 'Document',
  Page: 'Page',
  Text: 'Text',
  View: 'View',
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/server', () => ({ after: m.after }));
vi.mock('@/workflows/resume-parse.workflow', () => ({ runResumeParse: m.runResumeParse }));
vi.mock('@/lib/observability/logger', () => ({ logger: { error: vi.fn() } }));

import { generateResume } from '@/app/actions/generate-resume';

beforeEach(() => {
  vi.clearAllMocks();
  m.afterCallbacks.length = 0;
  m.after.mockImplementation((fn: () => unknown) => {
    m.afterCallbacks.push(fn);
  });
  m.runResumeParse.mockResolvedValue(undefined);
  m.requireRole.mockResolvedValue({
    id: 'seeker1',
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
  });
  m.profileFindUnique.mockResolvedValue({
    headline: 'Backend Engineer',
    location: 'Berlin, DE',
    portfolioUrl: 'https://github.com/ada',
    bio: 'I build things.',
    education: 'B.Sc. Computer Science',
    certifications: 'AWS Certified',
    skills: [{ skill: { label: 'TypeScript' } }, { skill: { label: 'React' } }],
    workExperiences: [
      {
        company: 'Acme',
        title: 'Engineer',
        startDate: 'Jan 2022',
        endDate: 'Present',
        description: 'Shipped stuff.',
      },
    ],
  });
  m.renderToBuffer.mockResolvedValue(Buffer.from('%PDF-1.4 fake'));
  m.storeConfigured.mockReturnValue(true);
  m.putStored.mockResolvedValue({
    url: 'https://s1.private.blob.vercel-storage.com/resumes/seeker1/generated-ab12.pdf',
    pathname: 'resumes/seeker1/generated-ab12.pdf',
  });
  m.resumeCreate.mockResolvedValue({ id: 'resume1' });
});

describe('generateResume', () => {
  it('propagates the auth error for non-seekers', async () => {
    m.requireRole.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(generateResume()).rejects.toThrow();
    expect(m.renderToBuffer).not.toHaveBeenCalled();
  });

  it('assembles profile + skills + experience into the PDF data and uploads it', async () => {
    const result = await generateResume();

    expect(m.renderToBuffer).toHaveBeenCalledTimes(1);
    const [element] = m.renderToBuffer.mock.calls[0]!;
    expect(element.props.data).toMatchObject({
      name: 'Ada Lovelace',
      headline: 'Backend Engineer',
      email: 'ada@example.com',
      skills: ['TypeScript', 'React'],
      experience: [
        {
          company: 'Acme',
          title: 'Engineer',
          startDate: 'Jan 2022',
          endDate: 'Present',
          description: 'Shipped stuff.',
        },
      ],
    });

    // A generated CV is a personal document: it goes to the PRIVATE store (it
    // used to be written with access: 'public').
    expect(m.putStored).toHaveBeenCalledWith(
      'private',
      'resumes/seeker1/generated.pdf',
      expect.any(Buffer),
      'application/pdf',
    );

    const created = m.resumeCreate.mock.calls[0]![0];
    expect(created.data.userId).toBe('seeker1');
    expect(created.data.fileMime).toBe('application/pdf');
    expect(created.data.fileBlobUrl).toBe(
      'https://s1.private.blob.vercel-storage.com/resumes/seeker1/generated-ab12.pdf',
    );
    // The storage locator is not handed back to the browser — only the id, which
    // the UI turns into the authenticated download route.
    expect(result).toEqual({ id: 'resume1' });
    // Profile-derived, so it is tagged and ParsedResume-shaped for the embedder.
    expect(created.data.parsedJson).toMatchObject({
      _source: 'profile',
      fullName: 'Ada Lovelace',
      summary: 'I build things.',
    });
  });

  it('falls back to email as the name when first/last name are missing', async () => {
    m.requireRole.mockResolvedValue({
      id: 'seeker1',
      email: 'ada@example.com',
      firstName: null,
      lastName: null,
    });
    await generateResume();
    const [element] = m.renderToBuffer.mock.calls[0]!;
    expect(element.props.data.name).toBe('ada@example.com');
  });

  it('renders sensible empty defaults when the profile has never been saved', async () => {
    m.profileFindUnique.mockResolvedValue(null);
    await generateResume();
    const [element] = m.renderToBuffer.mock.calls[0]!;
    expect(element.props.data).toMatchObject({
      headline: null,
      bio: null,
      skills: [],
      experience: [],
      education: null,
      certifications: null,
    });
  });

  it('schedules runResumeParse via after() so the generated resume is embedded for matches', async () => {
    await generateResume();
    expect(m.after).toHaveBeenCalledTimes(1);
    expect(m.runResumeParse).not.toHaveBeenCalled();
    for (const cb of m.afterCallbacks.splice(0)) await cb();
    expect(m.runResumeParse).toHaveBeenCalledWith({ resumeId: 'resume1' });
  });
});
