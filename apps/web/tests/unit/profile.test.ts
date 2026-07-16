import { vi, describe, it, expect, beforeEach } from 'vitest';

// Seeker profile save (JOB_UC_05): zod-validated upsert. Virtual-intern extras
// only persist on VIRTUAL_INTERN profiles; switching to EMPLOYABLE clears them
// so stale intern data never leaks into the directory.

const m = vi.hoisted(() => ({
  requireRole: vi.fn(),
  profileUpsert: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole }));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({ jobSeekerProfile: { upsert: m.profileUpsert } }),
}));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));

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
    ...over,
  } as ProfileInput;
}

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ id: 'seeker1' });
  m.profileUpsert.mockResolvedValue({ id: 'profile1' });
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
});
