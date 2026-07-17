import { vi, describe, it, expect, beforeEach } from 'vitest';

// Resume-builder work history (JOB_UC_05.0): reset-and-recreate on every save,
// same idempotent shape as saveProfile's skill relinking.

const m = vi.hoisted(() => ({
  requireRole: vi.fn(),
  profileUpsert: vi.fn(),
  workExperienceDeleteMany: vi.fn(),
  workExperienceCreateMany: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole }));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      jobSeekerProfile: { upsert: m.profileUpsert },
      workExperience: { deleteMany: m.workExperienceDeleteMany, createMany: m.workExperienceCreateMany },
    }),
}));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

import { saveWorkExperiences, type WorkExperienceInput } from '@/app/actions/work-experience';

function entry(over: Partial<WorkExperienceInput> = {}): WorkExperienceInput {
  return {
    company: 'Acme Inc.',
    title: 'Software Engineer',
    startDate: 'Jan 2022',
    endDate: 'Present',
    description: 'Built things.',
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ id: 'seeker1' });
  m.profileUpsert.mockResolvedValue({ id: 'profile1' });
  m.workExperienceDeleteMany.mockResolvedValue({ count: 0 });
  m.workExperienceCreateMany.mockResolvedValue({ count: 0 });
});

describe('saveWorkExperiences', () => {
  it('propagates the auth error for non-seekers', async () => {
    m.requireRole.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(saveWorkExperiences([entry()])).rejects.toThrow();
    expect(m.workExperienceDeleteMany).not.toHaveBeenCalled();
  });

  it('rejects an entry missing a required field', async () => {
    await expect(saveWorkExperiences([entry({ company: '' })])).rejects.toThrow();
    expect(m.workExperienceDeleteMany).not.toHaveBeenCalled();
  });

  it('finds-or-creates the profile, then resets and recreates entries in order', async () => {
    await saveWorkExperiences([
      entry({ company: 'Acme Inc.', title: 'Engineer' }),
      entry({ company: 'Globex', title: 'Senior Engineer' }),
    ]);

    expect(m.profileUpsert).toHaveBeenCalledWith({
      where: { userId: 'seeker1' },
      create: { userId: 'seeker1' },
      update: {},
      select: { id: true },
    });
    expect(m.workExperienceDeleteMany).toHaveBeenCalledWith({ where: { jobSeekerProfileId: 'profile1' } });
    const created = m.workExperienceCreateMany.mock.calls[0]![0];
    expect(created.data).toEqual([
      expect.objectContaining({ jobSeekerProfileId: 'profile1', company: 'Acme Inc.', title: 'Engineer' }),
      expect.objectContaining({ jobSeekerProfileId: 'profile1', company: 'Globex', title: 'Senior Engineer' }),
    ]);
    expect(m.updateTag).toHaveBeenCalledWith('user:seeker1');
  });

  it('stores blank optional dates/description as null', async () => {
    await saveWorkExperiences([entry({ startDate: '', endDate: '', description: '' })]);
    const created = m.workExperienceCreateMany.mock.calls[0]![0].data[0];
    expect(created.startDate).toBeNull();
    expect(created.endDate).toBeNull();
    expect(created.description).toBeNull();
  });

  it('clears all entries without recreating any when the list is empty', async () => {
    await saveWorkExperiences([]);
    expect(m.workExperienceDeleteMany).toHaveBeenCalledWith({ where: { jobSeekerProfileId: 'profile1' } });
    expect(m.workExperienceCreateMany).not.toHaveBeenCalled();
  });
});
