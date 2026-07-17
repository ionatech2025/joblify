import { vi, describe, it, expect, beforeEach } from 'vitest';

// Resume builder (JOB_UC_05.0): assembles profile + work experience + skills
// into a PDF, then stores it through the same Resume model as an upload so it
// shows up in "My resumes" without any separate list UI.

const m = vi.hoisted(() => ({
  requireRole: vi.fn(),
  profileFindUnique: vi.fn(),
  resumeCreate: vi.fn(),
  renderToBuffer: vi.fn(),
  put: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole }));
vi.mock('@/lib/db', () => ({ db: { jobSeekerProfile: { findUnique: m.profileFindUnique } } }));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({ resume: { create: m.resumeCreate } }),
}));
vi.mock('@/lib/storage/blob', () => ({
  put: m.put,
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

import { generateResume } from '@/app/actions/generate-resume';

beforeEach(() => {
  vi.clearAllMocks();
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
      { company: 'Acme', title: 'Engineer', startDate: 'Jan 2022', endDate: 'Present', description: 'Shipped stuff.' },
    ],
  });
  m.renderToBuffer.mockResolvedValue(Buffer.from('%PDF-1.4 fake'));
  m.put.mockResolvedValue({ url: 'https://blob.example.com/resumes/seeker1/generated-123.pdf' });
  m.resumeCreate.mockResolvedValue({ id: 'resume1', fileBlobUrl: 'https://blob.example.com/resumes/seeker1/generated-123.pdf' });
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
      experience: [{ company: 'Acme', title: 'Engineer', startDate: 'Jan 2022', endDate: 'Present', description: 'Shipped stuff.' }],
    });

    expect(m.put).toHaveBeenCalledWith(
      expect.stringMatching(/^resumes\/seeker1\/generated-\d+\.pdf$/),
      expect.any(Buffer),
      { access: 'public', contentType: 'application/pdf' },
    );

    const created = m.resumeCreate.mock.calls[0]![0];
    expect(created.data.userId).toBe('seeker1');
    expect(created.data.fileMime).toBe('application/pdf');
    expect(created.data.fileBlobUrl).toBe('https://blob.example.com/resumes/seeker1/generated-123.pdf');
    expect(result).toEqual({ id: 'resume1', fileBlobUrl: 'https://blob.example.com/resumes/seeker1/generated-123.pdf' });
  });

  it('falls back to email as the name when first/last name are missing', async () => {
    m.requireRole.mockResolvedValue({ id: 'seeker1', email: 'ada@example.com', firstName: null, lastName: null });
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
});
