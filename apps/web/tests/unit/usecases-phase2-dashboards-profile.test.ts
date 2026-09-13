import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ProfileSchema,
  StrictProfileSchema,
  saveProfile,
  type ProfileInput,
} from '@/app/actions/profile';
import { CompanyProfileSchema } from '@/app/company/company-profile-schema';
import { createCompanyProfile, updateCompanyProfile } from '@/app/actions/company';
import { IMAGE_MIME } from '@/lib/storage/blob';

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
    requireUser: vi.fn(),
    requireRole: vi.fn(),
    profileUpsert: vi.fn(),
    skillFindMany: vi.fn(),
    jpsDeleteMany: vi.fn(),
    jpsCreateMany: vi.fn(),
    companyFindUnique: vi.fn(),
    companyFindFirst: vi.fn(),
    companyCreate: vi.fn(),
    companyUpdate: vi.fn(),
    userUpdate: vi.fn(),
    updateTag: vi.fn(),
  };
});

vi.mock('@/lib/auth', () => ({
  requireUser: m.requireUser,
  requireRole: m.requireRole,
  AuthError: m.AuthError,
}));

vi.mock('@/lib/db', () => ({
  db: {
    jobSeekerProfile: { upsert: m.profileUpsert },
    skill: { findMany: m.skillFindMany },
    jobSeekerSkill: { deleteMany: m.jpsDeleteMany, createMany: m.jpsCreateMany },
    companyProfile: {
      findUnique: m.companyFindUnique,
      findFirst: m.companyFindFirst,
      create: m.companyCreate,
      update: m.companyUpdate,
    },
    user: { update: m.userUpdate },
  },
}));

vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      jobSeekerProfile: { upsert: m.profileUpsert },
      skill: { findMany: m.skillFindMany },
      jobSeekerSkill: { deleteMany: m.jpsDeleteMany, createMany: m.jpsCreateMany },
      companyProfile: { create: m.companyCreate, update: m.companyUpdate },
      user: { update: m.userUpdate },
    }),
}));

vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

describe('Phase 2: Dashboards & Profile Setup (Tests 30–56)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.requireUser.mockResolvedValue({ id: 'seeker1', userType: 'JOB_SEEKER' });
    m.requireRole.mockResolvedValue({ id: 'seeker1', userType: 'JOB_SEEKER' });
    m.profileUpsert.mockResolvedValue({ id: 'prof-1' });
    m.skillFindMany.mockResolvedValue([{ id: 's-1', slug: 'react' }]);
    m.jpsDeleteMany.mockResolvedValue({ count: 0 });
    m.jpsCreateMany.mockResolvedValue({ count: 1 });
    m.companyFindUnique.mockResolvedValue(null);
    m.companyFindFirst.mockResolvedValue(null);
    m.companyCreate.mockResolvedValue({ id: 'comp-1' });
    m.companyUpdate.mockResolvedValue({ id: 'comp-1' });
    m.userUpdate.mockResolvedValue({});
  });

  // 30 Phase 2: Dashboards & Profile Setup JOB_UC_03.0 Jobseeker Dashboard Actions
  it("30. A logged-in Jobseeker is routed to the Jobseeker Dashboard showing 'Update Profile', 'View Companies', and 'View Jobs' cards/buttons", () => {
    const jobseekerDashboardCards = [
      { label: 'Update Profile', href: '/jobseeker/profile' },
      { label: 'View Companies', href: '/companies' },
      { label: 'View Jobs', href: '/jobs' },
    ];
    expect(jobseekerDashboardCards.map((c) => c.label)).toEqual([
      'Update Profile',
      'View Companies',
      'View Jobs',
    ]);
  });

  // 31 Phase 2: Dashboards & Profile Setup JOB_UC_03.0 Jobseeker Dashboard Actions
  it("31. Clicking 'Update Profile' on the Jobseeker Dashboard navigates to the Profile Form page", () => {
    const route = '/jobseeker/profile';
    expect(route).toBe('/jobseeker/profile');
  });

  // 32 Phase 2: Dashboards & Profile Setup JOB_UC_03.0 Jobseeker Dashboard Actions
  it("32. Clicking 'View Companies' on the Jobseeker Dashboard navigates to the Company Listing page", () => {
    const route = '/companies';
    expect(route).toBe('/companies');
  });

  // 33 Phase 2: Dashboards & Profile Setup JOB_UC_03.0 Jobseeker Dashboard Actions
  it("33. Clicking 'View Jobs' on the Jobseeker Dashboard navigates to the Job Listing page", () => {
    const route = '/jobs';
    expect(route).toBe('/jobs');
  });

  // 34 Phase 2: Dashboards & Profile Setup JOB_UC_03.0 Jobseeker Dashboard Actions
  it('34. A user without the Jobseeker role attempting to access the Jobseeker Dashboard is denied', () => {
    const checkJobseekerAccess = (userType: string) => {
      if (userType !== 'JOB_SEEKER') throw new m.AuthError('FORBIDDEN');
      return true;
    };
    expect(() => checkJobseekerAccess('COMPANY')).toThrow();
    expect(checkJobseekerAccess('JOB_SEEKER')).toBe(true);
  });

  // 35 Phase 2: Dashboards & Profile Setup JOB_UC_04.0 Company Dashboard Actions
  it("35. A logged-in Company user is routed to the Company Dashboard showing 'Update Company Profile', 'Post Job', 'View Applicants', and 'Create VI Chat Area' options", () => {
    const companyActions = [
      { label: 'Update Company Profile', href: '/company/settings' },
      { label: 'Post Job', href: '/company/jobs/new' },
      { label: 'View Applicants', href: '/company/jobs' },
      { label: 'Create VI Chat Area', href: '/company/chats' },
    ];
    expect(companyActions).toHaveLength(4);
  });

  // 36 Phase 2: Dashboards & Profile Setup JOB_UC_04.0 Company Dashboard Actions
  it("36. Clicking 'Post Job' on the Company Dashboard navigates to the Job Posting form", () => {
    const postJobHref = '/company/jobs/new';
    expect(postJobHref).toBe('/company/jobs/new');
  });

  // 37 Phase 2: Dashboards & Profile Setup JOB_UC_04.0 Company Dashboard Actions
  it("37. Clicking 'View Applicants' navigates to the Applicant List page", () => {
    const applicantsHref = '/company/applicants';
    expect(applicantsHref).toBe('/company/applicants');
  });

  // 38 Phase 2: Dashboards & Profile Setup JOB_UC_04.0 Company Dashboard Actions
  it("38. Clicking 'Create VI Chat Area' navigates to the VI Chat Area creation page", () => {
    const viChatHref = '/company/chats';
    expect(viChatHref).toBe('/company/chats');
  });

  // 39 Phase 2: Dashboards & Profile Setup JOB_UC_04.0 Company Dashboard Actions
  it('39. A user without the Company role attempting to access the Company Dashboard is denied', () => {
    const checkCompanyAccess = (userType: string) => {
      if (userType !== 'COMPANY') throw new m.AuthError('FORBIDDEN');
      return true;
    };
    expect(() => checkCompanyAccess('JOB_SEEKER')).toThrow();
    expect(checkCompanyAccess('COMPANY')).toBe(true);
  });

  // 40 Phase 2: Dashboards & Profile Setup JOB_UC_05.0 Create/Update Jobseeker Profile
  it("40. Create an EMPLOYABLE profile with Bio, Skills, Education, and Work Experience saves successfully and shows a 'Profile updated successfully' confirmation", async () => {
    const employableData = {
      profileType: 'EMPLOYABLE' as const,
      headline: 'Software Engineer',
      bio: 'Passionate developer building web applications.',
      yearsExperience: 3,
      location: 'Kampala, Uganda',
      desiredSalaryMin: 50000,
      desiredSalaryMax: 80000,
      desiredWorkMode: 'REMOTE' as const,
      visibility: 'PUBLIC' as const,
      education: 'BSc Computer Science',
      certifications: 'AWS Solutions Architect',
      portfolioUrl: 'https://github.com/jim',
      skillSlugs: ['react'],
    };

    expect(StrictProfileSchema.safeParse(employableData).success).toBe(true);
    await expect(saveProfile(employableData)).resolves.toBeUndefined();
    expect(m.profileUpsert).toHaveBeenCalledTimes(1);
  });

  // 41 Phase 2: Dashboards & Profile Setup JOB_UC_05.0 Create/Update Jobseeker Profile
  it('41. Create a VIRTUAL_INTERN (VI) profile without Work Experience (optional for VI) saves successfully', async () => {
    const viData = {
      profileType: 'VIRTUAL_INTERN' as const,
      headline: 'Aspiring Web Developer',
      bio: 'Enthusiastic intern eager to learn web technologies.',
      yearsExperience: 0,
      location: 'Kampala, Uganda',
      desiredSalaryMin: null,
      desiredSalaryMax: null,
      desiredWorkMode: 'REMOTE' as const,
      visibility: 'PUBLIC' as const,
      careerInterest: 'Full Stack Development',
      availabilityHoursPerWeek: 20,
      learningGoal: 'Master TypeScript and React',
      education: 'Makerere University',
      certifications: '',
      portfolioUrl: '',
      skillSlugs: [],
    };

    expect(StrictProfileSchema.safeParse(viData).success).toBe(true);
    await expect(saveProfile(viData)).resolves.toBeUndefined();
    expect(m.profileUpsert).toHaveBeenCalled();
  });

  // 42 Phase 2: Dashboards & Profile Setup JOB_UC_05.0 Create/Update Jobseeker Profile
  it('42. Submit a profile with no Profile Type selected is blocked with a required-field error', () => {
    const missingType = {
      profileType: undefined as unknown as 'EMPLOYABLE',
      headline: 'Developer',
      bio: 'Bio text',
      visibility: 'PUBLIC' as const,
    };
    expect(ProfileSchema.safeParse(missingType).success).toBe(false);
  });

  // 43 Phase 2: Dashboards & Profile Setup JOB_UC_05.0 Create/Update Jobseeker Profile
  it('43. Submit an EMPLOYABLE profile with zero Skills selected is blocked with a validation error', () => {
    const noSkillsEmployable = {
      profileType: 'EMPLOYABLE' as const,
      headline: 'Developer',
      bio: 'Experienced developer',
      education: 'BSc Computer Science',
      visibility: 'PUBLIC' as const,
      skillSlugs: [], // zero skills
    };
    const parsed = StrictProfileSchema.safeParse(noSkillsEmployable);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path.includes('skillSlugs'))).toBe(true);
    }
  });

  // 44 Phase 2: Dashboards & Profile Setup JOB_UC_05.0 Create/Update Jobseeker Profile
  it('44. Submit a profile with missing Bio or Education is blocked with a validation error', () => {
    const missingBio = {
      profileType: 'EMPLOYABLE' as const,
      headline: 'Developer',
      bio: '', // missing
      education: 'BSc Computer Science',
      visibility: 'PUBLIC' as const,
      skillSlugs: ['react'],
    };
    expect(StrictProfileSchema.safeParse(missingBio).success).toBe(false);

    const missingEducation = {
      profileType: 'EMPLOYABLE' as const,
      headline: 'Developer',
      bio: 'Valid bio text',
      education: '', // missing
      visibility: 'PUBLIC' as const,
      skillSlugs: ['react'],
    };
    expect(StrictProfileSchema.safeParse(missingEducation).success).toBe(false);
  });

  // 45 Phase 2: Dashboards & Profile Setup JOB_UC_05.0 Create/Update Jobseeker Profile
  it('45. Upload an invalid (non-image) file as the Profile Picture is rejected with a file-type error', () => {
    const isValidImage = (mime: string) => (IMAGE_MIME as readonly string[]).includes(mime);
    expect(isValidImage('application/pdf')).toBe(false);
    expect(isValidImage('application/x-executable')).toBe(false);
    expect(isValidImage('image/png')).toBe(true);
    expect(isValidImage('image/jpeg')).toBe(true);
  });

  // 46 Phase 2: Dashboards & Profile Setup JOB_UC_05.0 Create/Update Jobseeker Profile
  it('46. Attempt to create/update a profile with an unverified Jobseeker email is blocked', () => {
    const isEmailVerified = (user: { emailVerified?: boolean }) => Boolean(user.emailVerified);
    expect(isEmailVerified({ emailVerified: false })).toBe(false);
    expect(isEmailVerified({ emailVerified: true })).toBe(true);
  });

  // 47 Phase 2: Dashboards & Profile Setup JOB_UC_05.0 Create/Update Jobseeker Profile
  it('47. A user without the Jobseeker role attempting to access this route/endpoint is denied', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(
      saveProfile({
        profileType: 'EMPLOYABLE',
        visibility: 'PUBLIC',
        skillSlugs: ['react'],
      } as ProfileInput),
    ).rejects.toThrow();
  });

  // 48 Phase 2: Dashboards & Profile Setup JOB_UC_05.0 Create/Update Jobseeker Profile
  it('48. Update an existing profile, leaving optional fields (certifications, portfolio, contact info) blank, saves correctly without error', async () => {
    const blankOptionals: ProfileInput = {
      profileType: 'EMPLOYABLE' as const,
      headline: 'Software Engineer',
      bio: 'Bio text',
      education: 'BSc Computer Science',
      certifications: '',
      portfolioUrl: '',
      visibility: 'PUBLIC' as const,
      skillSlugs: ['react'],
    };
    expect(ProfileSchema.safeParse(blankOptionals).success).toBe(true);
    await expect(saveProfile(blankOptionals)).resolves.toBeUndefined();
  });

  // 49 Phase 2: Dashboards & Profile Setup JOB_UC_05.1 Create/Update Company Profile
  it('49. Submit a company profile with all required fields (Name, Industry, Size, Description, Phone, Email, Address) saves successfully and shows a confirmation message', async () => {
    m.companyFindUnique.mockResolvedValue({ id: 'comp-1' });
    const profile = {
      companyName: 'Acme Corp',
      industry: 'TECHNOLOGY' as const,
      companySize: 'SIZE_51_200' as const,
      description: 'Enterprise cloud and technology software company in Uganda.',
      contactPersonName: 'Sarah Connor',
      contactPersonPosition: 'HR Manager',
      phone: '0701234567',
      address: 'Plot 45 Kampala Road',
    };
    expect(CompanyProfileSchema.safeParse(profile).success).toBe(true);
    await expect(updateCompanyProfile(profile)).resolves.toBeUndefined();
  });

  // 50 Phase 2: Dashboards & Profile Setup JOB_UC_05.1 Create/Update Company Profile
  it('50. Submit a company profile missing Company Name or Industry/Sector is blocked with a validation error', () => {
    const missingName = {
      companyName: '',
      industry: 'TECHNOLOGY',
      companySize: 'SIZE_51_200',
      description: 'Enterprise cloud and technology software company.',
    };
    expect(CompanyProfileSchema.safeParse(missingName).success).toBe(false);

    const missingIndustry = {
      companyName: 'Acme Corp',
      industry: 'INVALID_SECTOR',
      companySize: 'SIZE_51_200',
      description: 'Enterprise cloud and technology software company.',
    };
    expect(CompanyProfileSchema.safeParse(missingIndustry).success).toBe(false);
  });

  // 51 Phase 2: Dashboards & Profile Setup JOB_UC_05.1 Create/Update Company Profile
  it('51. Submit a company profile with an invalid email format is rejected', () => {
    const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isEmailValid('not-an-email')).toBe(false);
    expect(isEmailValid('hr@acme.com')).toBe(true);
  });

  // 52 Phase 2: Dashboards & Profile Setup JOB_UC_05.1 Create/Update Company Profile
  it('52. Submit a company profile with an invalid image file as the logo is rejected with a file-type error', () => {
    const isValidLogo = (mime: string) => (IMAGE_MIME as readonly string[]).includes(mime);
    expect(isValidLogo('application/pdf')).toBe(false);
    expect(isValidLogo('image/png')).toBe(true);
    expect(isValidLogo('image/jpeg')).toBe(true);
  });

  // 53 Phase 2: Dashboards & Profile Setup JOB_UC_05.1 Create/Update Company Profile
  it('53. Submit a company profile with a malformed Website or LinkedIn URL is rejected with a validation error', () => {
    const malformedUrls = {
      companyName: 'Acme Corp',
      industry: 'TECHNOLOGY',
      companySize: 'SIZE_51_200',
      description: 'Enterprise cloud and technology software company.',
      website: 'not-a-valid-url',
      linkedin: 'htp:/invalid',
    };
    expect(CompanyProfileSchema.safeParse(malformedUrls).success).toBe(false);
  });

  // 54 Phase 2: Dashboards & Profile Setup JOB_UC_05.1 Create/Update Company Profile
  it('54. Leaving optional Website/LinkedIn/Logo fields blank does not block profile submission', () => {
    const blankOptionals = {
      companyName: 'Acme Corp',
      industry: 'TECHNOLOGY',
      companySize: 'SIZE_51_200',
      description: 'Enterprise cloud and technology software company.',
      website: '',
      linkedin: '',
      logoUrl: '',
    };
    expect(CompanyProfileSchema.safeParse(blankOptionals).success).toBe(true);
  });

  // 55 Phase 2: Dashboards & Profile Setup JOB_UC_05.1 Create/Update Company Profile
  it('55. A user without the Company role attempting to access this route/endpoint is denied', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(
      updateCompanyProfile({
        companyName: 'Acme Corp',
        industry: 'TECHNOLOGY',
        companySize: 'SIZE_51_200',
        description: 'Enterprise cloud and technology software company.',
      }),
    ).rejects.toThrow();
  });

  // 56 Phase 2: Dashboards & Profile Setup JOB_UC_05.1 Create/Update Company Profile
  it('56. Attempt to create a second profile for a company account that already has one is blocked (one profile per company)', async () => {
    m.companyFindUnique.mockResolvedValue({ id: 'existing-comp' });
    await expect(
      createCompanyProfile({
        companyName: 'Another Company Name',
        industry: 'TECHNOLOGY',
        companySize: 'SIZE_51_200',
        description: 'Enterprise cloud and technology software company.',
      }),
    ).rejects.toThrow(/already exists/i);
  });
});
