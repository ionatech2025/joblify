import { vi, describe, it, expect, beforeEach } from 'vitest';

// Seeker profile save (JOB_UC_05): zod-validated upsert. Virtual-intern extras
// only persist on VIRTUAL_INTERN profiles; switching to EMPLOYABLE clears them
// so stale intern data never leaks into the directory.

const m = vi.hoisted(() => ({
  requireRole: vi.fn(),
  profileUpsert: vi.fn(),
  skillFindMany: vi.fn(),
  jobSeekerSkillDeleteMany: vi.fn(),
  jobSeekerSkillCreateMany: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole }));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      jobSeekerProfile: { upsert: m.profileUpsert },
      skill: { findMany: m.skillFindMany },
      jobSeekerSkill: { deleteMany: m.jobSeekerSkillDeleteMany, createMany: m.jobSeekerSkillCreateMany },
    }),
}));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

import { saveProfile, type ProfileInput } from '@/app/actions/profile';

function input(over: Partial<ProfileInput> = {}): ProfileInput {
  return {
    profileType: 'EMPLOYABLE',
    headline: 'Backend engineer',
    bio: '',
    yearsExperience: 3,
    location: 'Berlin, DE',
    desiredSalaryMin: 60000,
    desiredSalaryMax: 90000,
    desiredWorkMode: 'REMOTE',
    visibility: 'PUBLIC',
    careerInterest: '',
    availabilityHoursPerWeek: null,
    learningGoal: '',
    education: '',
    certifications: '',
    portfolioUrl: '',
    skillSlugs: [],
    ...over,
  } as ProfileInput;
}

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ id: 'seeker1' });
  m.profileUpsert.mockResolvedValue({ id: 'profile1' });
  m.skillFindMany.mockResolvedValue([]);
  m.jobSeekerSkillDeleteMany.mockResolvedValue({ count: 0 });
  m.jobSeekerSkillCreateMany.mockResolvedValue({ count: 0 });
});

describe('saveProfile', () => {
  it('propagates the auth error for non-seekers', async () => {
    m.requireRole.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(saveProfile(input())).rejects.toThrow();
    expect(m.profileUpsert).not.toHaveBeenCalled();
  });

  it('rejects out-of-range input before writing', async () => {
    await expect(saveProfile(input({ yearsExperience: 999 }))).rejects.toThrow();
    expect(m.profileUpsert).not.toHaveBeenCalled();
  });

  it('clears virtual-intern extras on an EMPLOYABLE profile', async () => {
    await saveProfile(
      input({
        profileType: 'EMPLOYABLE',
        careerInterest: 'AI',
        availabilityHoursPerWeek: 20,
        learningGoal: 'ship',
      }),
    );
    const data = m.profileUpsert.mock.calls[0]![0];
    expect(data.create.careerInterest).toBeNull();
    expect(data.create.availabilityHoursPerWeek).toBeNull();
    expect(data.create.learningGoal).toBeNull();
    expect(data.update.careerInterest).toBeNull();
    expect(data.create.visibility).toBe('PUBLIC');
    expect(m.updateTag).toHaveBeenCalledWith('user:seeker1');
  });

  it('persists virtual-intern extras on a VIRTUAL_INTERN profile', async () => {
    await saveProfile(
      input({
        profileType: 'VIRTUAL_INTERN',
        careerInterest: 'Data science',
        availabilityHoursPerWeek: 15,
        learningGoal: 'Learn SQL',
      }),
    );
    const data = m.profileUpsert.mock.calls[0]![0];
    expect(data.create.profileType).toBe('VIRTUAL_INTERN');
    expect(data.create.careerInterest).toBe('Data science');
    expect(data.create.availabilityHoursPerWeek).toBe(15);
    expect(data.create.learningGoal).toBe('Learn SQL');
  });

  it('persists education, certifications, and portfolio URL', async () => {
    await saveProfile(
      input({
        education: 'B.Sc. Computer Science',
        certifications: 'AWS Certified Solutions Architect',
        portfolioUrl: 'https://github.com/adaeze',
      }),
    );
    const data = m.profileUpsert.mock.calls[0]![0];
    expect(data.create.education).toBe('B.Sc. Computer Science');
    expect(data.create.certifications).toBe('AWS Certified Solutions Architect');
    expect(data.create.portfolioUrl).toBe('https://github.com/adaeze');
  });

  it('stores empty optional text fields as null, not empty strings', async () => {
    await saveProfile(input({ education: '', certifications: '', portfolioUrl: '' }));
    const data = m.profileUpsert.mock.calls[0]![0];
    expect(data.create.education).toBeNull();
    expect(data.create.certifications).toBeNull();
    expect(data.create.portfolioUrl).toBeNull();
  });

  it('rejects a malformed portfolio URL before writing', async () => {
    await expect(saveProfile(input({ portfolioUrl: 'not-a-url' }))).rejects.toThrow();
    expect(m.profileUpsert).not.toHaveBeenCalled();
  });

  it('resets and relinks skills against the canonical catalog', async () => {
    m.skillFindMany.mockResolvedValue([
      { id: 'skill-react', slug: 'react', label: 'React' },
      { id: 'skill-ts', slug: 'typescript', label: 'TypeScript' },
    ]);
    await saveProfile(input({ skillSlugs: ['react', 'typescript'] }));

    expect(m.jobSeekerSkillDeleteMany).toHaveBeenCalledWith({
      where: { jobSeekerProfileId: 'profile1' },
    });
    expect(m.skillFindMany).toHaveBeenCalledWith({ where: { slug: { in: ['react', 'typescript'] } } });
    const created = m.jobSeekerSkillCreateMany.mock.calls[0]![0];
    expect(created.data).toEqual([
      { jobSeekerProfileId: 'profile1', skillId: 'skill-react' },
      { jobSeekerProfileId: 'profile1', skillId: 'skill-ts' },
    ]);
  });

  it('clears skills without recreating any when skillSlugs is empty', async () => {
    await saveProfile(input({ skillSlugs: [] }));
    expect(m.jobSeekerSkillDeleteMany).toHaveBeenCalledWith({
      where: { jobSeekerProfileId: 'profile1' },
    });
    expect(m.skillFindMany).not.toHaveBeenCalled();
    expect(m.jobSeekerSkillCreateMany).not.toHaveBeenCalled();
  });
});
