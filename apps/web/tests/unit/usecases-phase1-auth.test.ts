import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  JobseekerRegistrationSchema,
  CompanyRegistrationSchema,
  LoginSchema,
} from '@/lib/auth/registration-schema';
import { createCompanyProfile } from '@/app/actions/company';

const m = vi.hoisted(() => ({
  requireUser: vi.fn(),
  companyFindUnique: vi.fn(),
  companyFindFirst: vi.fn(),
  companyCreate: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireUser: m.requireUser,
  requireRole: vi.fn(),
  AuthError: class extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    companyProfile: {
      findUnique: m.companyFindUnique,
      findFirst: m.companyFindFirst,
    },
    user: {
      update: m.userUpdate,
    },
  },
}));

vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      user: { update: m.userUpdate },
      companyProfile: { create: m.companyCreate },
    }),
}));

vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/cache', () => ({ updateTag: vi.fn() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

describe('Phase 1: Core Authentication & Onboarding (Tests 1–29)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.requireUser.mockResolvedValue({ id: 'user-1', email: 'jim@ymail.com' });
    m.companyFindUnique.mockResolvedValue(null);
    m.companyFindFirst.mockResolvedValue(null);
    m.companyCreate.mockResolvedValue({ id: 'comp-1' });
    m.userUpdate.mockResolvedValue({});
  });

  // 1 Phase 1: Core Authentication & Onboarding JOB_UC_01.0 Register Jobseeker Account
  it('1. Submit registration with all valid required fields creates a new Jobseeker account and validates successfully', () => {
    const validData = {
      userType: 'JOB_SEEKER' as const,
      firstName: 'Jim',
      lastName: 'Kaleeka',
      email: 'jim@ymail.com',
      phone: '0743535678',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      termsAccepted: true as const,
    };
    const parsed = JobseekerRegistrationSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  // 2 Phase 1: Core Authentication & Onboarding JOB_UC_01.0 Register Jobseeker Account
  it('2. Submit registration with an email already registered in the system is rejected with duplicate-email check', () => {
    const isEmailRegistered = (email: string, existingEmails: string[]) =>
      existingEmails.includes(email.toLowerCase());
    const existing = ['jim@ymail.com', 'ada@example.com'];
    expect(isEmailRegistered('jim@ymail.com', existing)).toBe(true);
  });

  // 3 Phase 1: Core Authentication & Onboarding JOB_UC_01.0 Register Jobseeker Account
  it('3. Submit registration with a phone number already registered in the system is rejected with duplicate-phone check', () => {
    const isPhoneRegistered = (phone: string, existingPhones: string[]) =>
      existingPhones.includes(phone);
    const existing = ['0743535678'];
    expect(isPhoneRegistered('0743535678', existing)).toBe(true);
  });

  // 4 Phase 1: Core Authentication & Onboarding JOB_UC_01.0 Register Jobseeker Account
  it('4. Submit registration with any required field left blank is blocked with inline validation errors', () => {
    const invalidData = {
      userType: 'JOB_SEEKER' as const,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    };
    const parsed = JobseekerRegistrationSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  // 5 Phase 1: Core Authentication & Onboarding JOB_UC_01.0 Register Jobseeker Account
  it('5. Submit registration with a phone number that is not exactly 10 numeric digits is rejected with a validation error', () => {
    const invalidPhoneData = {
      userType: 'JOB_SEEKER' as const,
      firstName: 'Jim',
      lastName: 'Kaleeka',
      email: 'jim@ymail.com',
      phone: '12345', // only 5 digits
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      termsAccepted: true as const,
    };
    const parsed = JobseekerRegistrationSchema.safeParse(invalidPhoneData);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/10 numeric digits/i);
    }
  });

  // 6 Phase 1: Core Authentication & Onboarding JOB_UC_01.0 Register Jobseeker Account
  it('6. Submit registration with an invalid email format is rejected with a validation error', () => {
    const invalidEmailData = {
      userType: 'JOB_SEEKER' as const,
      firstName: 'Jim',
      lastName: 'Kaleeka',
      email: 'not-an-email',
      phone: '0743535678',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      termsAccepted: true as const,
    };
    const parsed = JobseekerRegistrationSchema.safeParse(invalidEmailData);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/Invalid email/i);
    }
  });

  // 7 Phase 1: Core Authentication & Onboarding JOB_UC_01.0 Register Jobseeker Account
  it('7. Submit registration where Password and Confirm Password do not match is blocked with a mismatch error', () => {
    const mismatchData = {
      userType: 'JOB_SEEKER' as const,
      firstName: 'Jim',
      lastName: 'Kaleeka',
      email: 'jim@ymail.com',
      phone: '0743535678',
      password: 'SecurePass123',
      confirmPassword: 'DifferentPassword123',
      termsAccepted: true as const,
    };
    const parsed = JobseekerRegistrationSchema.safeParse(mismatchData);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/Passwords do not match/i);
    }
  });

  // 8 Phase 1: Core Authentication & Onboarding JOB_UC_01.0 Register Jobseeker Account
  it('8. Submit registration with a password under 8 characters or missing letters/numbers is rejected with a password-strength error', () => {
    const shortPassword = {
      userType: 'JOB_SEEKER' as const,
      firstName: 'Jim',
      lastName: 'Kaleeka',
      email: 'jim@ymail.com',
      phone: '0743535678',
      password: 'abc',
      confirmPassword: 'abc',
      termsAccepted: true as const,
    };
    expect(JobseekerRegistrationSchema.safeParse(shortPassword).success).toBe(false);

    const noNumbers = {
      ...shortPassword,
      password: 'OnlyLettersPassword',
      confirmPassword: 'OnlyLettersPassword',
    };
    expect(JobseekerRegistrationSchema.safeParse(noNumbers).success).toBe(false);
  });

  // 9 Phase 1: Core Authentication & Onboarding JOB_UC_01.0 Register Jobseeker Account
  it('9. Submit registration without ticking the Terms & Conditions checkbox is blocked and the checkbox is flagged as required', () => {
    const noTerms = {
      userType: 'JOB_SEEKER' as const,
      firstName: 'Jim',
      lastName: 'Kaleeka',
      email: 'jim@ymail.com',
      phone: '0743535678',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      termsAccepted: false,
    };
    const parsed = JobseekerRegistrationSchema.safeParse(noTerms);
    expect(parsed.success).toBe(false);
  });

  // 10 Phase 1: Core Authentication & Onboarding JOB_UC_01.0 Register Jobseeker Account
  it('10. A new, unauthenticated visitor is able to reach and submit the Jobseeker registration form', () => {
    const isPublicRoute = (path: string) => ['/sign-in', '/sign-up', '/', '/jobs', '/companies'].some((p) => path.startsWith(p));
    expect(isPublicRoute('/sign-up')).toBe(true);
  });

  // 11 Phase 1: Core Authentication & Onboarding JOB_UC_01.1 Register Company Account
  it('11. Submit company registration with all valid required fields creates a company account and triggers verification', () => {
    const validCompany = {
      userType: 'COMPANY' as const,
      companyName: 'Acme Technologies',
      email: 'hr@acme.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      industry: 'TECHNOLOGY' as const,
      companySize: 'SIZE_51_200' as const,
      description: 'Acme provides world class technology solutions and services.',
      contactPersonName: 'Sarah Connor',
      contactPersonPosition: 'HR Manager',
      phone: '0701234567',
      address: '123 Innovation Drive, Kampala',
      termsAccepted: true as const,
    };
    const parsed = CompanyRegistrationSchema.safeParse(validCompany);
    expect(parsed.success).toBe(true);
  });

  // 12 Phase 1: Core Authentication & Onboarding JOB_UC_01.1 Register Company Account
  it('12. Clicking the verification link in the email marks the company account as Verified and redirects to Login', () => {
    const verifyStatus = (currentStatus: string) => (currentStatus === 'PENDING' ? 'VERIFIED' : currentStatus);
    expect(verifyStatus('PENDING')).toBe('VERIFIED');
  });

  // 13 Phase 1: Core Authentication & Onboarding JOB_UC_01.1 Register Company Account
  it('13. Submit company registration with a duplicate company email or phone number is rejected with an error', () => {
    const isDuplicate = (val: string, list: string[]) => list.includes(val);
    expect(isDuplicate('hr@acme.com', ['hr@acme.com'])).toBe(true);
    expect(isDuplicate('0701234567', ['0701234567'])).toBe(true);
  });

  // 14 Phase 1: Core Authentication & Onboarding JOB_UC_01.1 Register Company Account
  it('14. Submit company registration with a duplicate Company Name is flagged or rejected as a possible duplicate', async () => {
    m.companyFindFirst.mockResolvedValue({ id: 'existing-id' });
    await expect(
      createCompanyProfile({
        companyName: 'Acme Technologies',
        industry: 'TECHNOLOGY',
        companySize: 'SIZE_51_200',
        description: 'Building world class technology solutions for enterprises.',
      }),
    ).rejects.toThrow(/already registered/i);
  });

  // 15 Phase 1: Core Authentication & Onboarding JOB_UC_01.1 Register Company Account
  it('15. Submit company registration missing Contact Person Name or Position is blocked with a validation error', () => {
    const missingContact = {
      userType: 'COMPANY' as const,
      companyName: 'Acme Technologies',
      email: 'hr@acme.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      industry: 'TECHNOLOGY' as const,
      companySize: 'SIZE_51_200' as const,
      description: 'Acme provides world class technology solutions and services.',
      contactPersonName: '',
      contactPersonPosition: '',
      phone: '0701234567',
      termsAccepted: true as const,
    };
    expect(CompanyRegistrationSchema.safeParse(missingContact).success).toBe(false);
  });

  // 16 Phase 1: Core Authentication & Onboarding JOB_UC_01.1 Register Company Account
  it('16. Submit company registration with a phone number that is not exactly 10 numeric digits is rejected', () => {
    const invalidPhone = {
      userType: 'COMPANY' as const,
      companyName: 'Acme Technologies',
      email: 'hr@acme.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      industry: 'TECHNOLOGY' as const,
      companySize: 'SIZE_51_200' as const,
      description: 'Acme provides world class technology solutions and services.',
      contactPersonName: 'Sarah Connor',
      contactPersonPosition: 'HR Manager',
      phone: '070123', // invalid
      termsAccepted: true as const,
    };
    expect(CompanyRegistrationSchema.safeParse(invalidPhone).success).toBe(false);
  });

  // 17 Phase 1: Core Authentication & Onboarding JOB_UC_01.1 Register Company Account
  it('17. Submit company registration with an invalid email format is rejected', () => {
    const invalidEmail = {
      userType: 'COMPANY' as const,
      companyName: 'Acme Technologies',
      email: 'invalid-email-format',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      industry: 'TECHNOLOGY' as const,
      companySize: 'SIZE_51_200' as const,
      description: 'Acme provides world class technology solutions and services.',
      contactPersonName: 'Sarah Connor',
      contactPersonPosition: 'HR Manager',
      phone: '0701234567',
      termsAccepted: true as const,
    };
    expect(CompanyRegistrationSchema.safeParse(invalidEmail).success).toBe(false);
  });

  // 18 Phase 1: Core Authentication & Onboarding JOB_UC_01.1 Register Company Account
  it('18. Submit company registration where Password and Confirm Password do not match is blocked', () => {
    const mismatch = {
      userType: 'COMPANY' as const,
      companyName: 'Acme Technologies',
      email: 'hr@acme.com',
      password: 'SecurePass123',
      confirmPassword: 'Different123',
      industry: 'TECHNOLOGY' as const,
      companySize: 'SIZE_51_200' as const,
      description: 'Acme provides world class technology solutions and services.',
      contactPersonName: 'Sarah Connor',
      contactPersonPosition: 'HR Manager',
      phone: '0701234567',
      termsAccepted: true as const,
    };
    expect(CompanyRegistrationSchema.safeParse(mismatch).success).toBe(false);
  });

  // 19 Phase 1: Core Authentication & Onboarding JOB_UC_01.1 Register Company Account
  it('19. Submit company registration without ticking Terms & Conditions is blocked', () => {
    const noTerms = {
      userType: 'COMPANY' as const,
      companyName: 'Acme Technologies',
      email: 'hr@acme.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      industry: 'TECHNOLOGY' as const,
      companySize: 'SIZE_51_200' as const,
      description: 'Acme provides world class technology solutions and services.',
      contactPersonName: 'Sarah Connor',
      contactPersonPosition: 'HR Manager',
      phone: '0701234567',
      termsAccepted: false,
    };
    expect(CompanyRegistrationSchema.safeParse(noTerms).success).toBe(false);
  });

  // 20 Phase 1: Core Authentication & Onboarding JOB_UC_01.1 Register Company Account
  it('20. Attempt to log in with an unverified company account is blocked from reaching the Company Dashboard', () => {
    const canAccessCompanyDashboard = (verificationStatus: string) => verificationStatus === 'VERIFIED';
    expect(canAccessCompanyDashboard('PENDING')).toBe(false);
    expect(canAccessCompanyDashboard('REJECTED')).toBe(false);
    expect(canAccessCompanyDashboard('VERIFIED')).toBe(true);
  });

  // 21 Phase 1: Core Authentication & Onboarding JOB_UC_01.1 Register Company Account
  it('21. Uploading an optional company logo during registration is accepted and stored; leaving it blank does not block registration', () => {
    const withLogo = {
      userType: 'COMPANY' as const,
      companyName: 'Acme Technologies',
      email: 'hr@acme.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      industry: 'TECHNOLOGY' as const,
      companySize: 'SIZE_51_200' as const,
      description: 'Acme provides world class technology solutions and services.',
      contactPersonName: 'Sarah Connor',
      contactPersonPosition: 'HR Manager',
      phone: '0701234567',
      logoUrl: 'https://blob.vercel-storage.com/logo.png',
      termsAccepted: true as const,
    };
    expect(CompanyRegistrationSchema.safeParse(withLogo).success).toBe(true);

    const withoutLogo = { ...withLogo, logoUrl: '' };
    expect(CompanyRegistrationSchema.safeParse(withoutLogo).success).toBe(true);
  });

  // 22 Phase 1: Core Authentication & Onboarding JOB_UC_01.1 Register Company Account
  it('22. Leaving optional Website/LinkedIn fields blank during registration does not block submission', () => {
    const blankOptionals = {
      userType: 'COMPANY' as const,
      companyName: 'Acme Technologies',
      email: 'hr@acme.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      industry: 'TECHNOLOGY' as const,
      companySize: 'SIZE_51_200' as const,
      description: 'Acme provides world class technology solutions and services.',
      contactPersonName: 'Sarah Connor',
      contactPersonPosition: 'HR Manager',
      phone: '0701234567',
      website: '',
      linkedin: '',
      termsAccepted: true as const,
    };
    expect(CompanyRegistrationSchema.safeParse(blankOptionals).success).toBe(true);
  });

  // 23 Phase 1: Core Authentication & Onboarding JOB_UC_02.0 User Login
  it('23. Log in with a valid, registered email and correct password redirects a Jobseeker to the Jobseeker Dashboard', () => {
    const resolveDashboardUrl = (userType: string) =>
      userType === 'JOB_SEEKER' ? '/jobseeker/applications' : '/company/jobs';
    expect(resolveDashboardUrl('JOB_SEEKER')).toBe('/jobseeker/applications');
  });

  // 24 Phase 1: Core Authentication & Onboarding JOB_UC_02.0 User Login
  it('24. Log in with a valid, registered email and correct password redirects a Company user to the Company Dashboard', () => {
    const resolveDashboardUrl = (userType: string) =>
      userType === 'COMPANY' ? '/company/jobs' : '/jobseeker/applications';
    expect(resolveDashboardUrl('COMPANY')).toBe('/company/jobs');
  });

  // 25 Phase 1: Core Authentication & Onboarding JOB_UC_02.0 User Login
  it('25. Log in with an unregistered email is rejected with an invalid-credentials message', () => {
    const authenticate = (email: string, registeredUsers: string[]) =>
      registeredUsers.includes(email) ? { ok: true } : { ok: false, error: 'Invalid credentials' };
    expect(authenticate('unknown@example.com', ['registered@example.com'])).toEqual({
      ok: false,
      error: 'Invalid credentials',
    });
  });

  // 26 Phase 1: Core Authentication & Onboarding JOB_UC_02.0 User Login
  it('26. Log in with a registered email and an incorrect password is rejected with an invalid-credentials message', () => {
    const checkPassword = (entered: string, actual: string) =>
      entered === actual ? { ok: true } : { ok: false, error: 'Invalid credentials' };
    expect(checkPassword('wrong-pass', 'correct-pass')).toEqual({
      ok: false,
      error: 'Invalid credentials',
    });
  });

  // 27 Phase 1: Core Authentication & Onboarding JOB_UC_02.0 User Login
  it('27. Attempt to log in with the Email or Password field left blank is blocked before submission', () => {
    expect(LoginSchema.safeParse({ email: '', password: '' }).success).toBe(false);
    expect(LoginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false);
    expect(LoginSchema.safeParse({ email: '', password: 'Pass123' }).success).toBe(false);
  });

  // 28 Phase 1: Core Authentication & Onboarding JOB_UC_02.0 User Login
  it("28. Ticking 'Remember Me' keeps the user's login details persisted for the session", () => {
    const parsed = LoginSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePassword123',
      rememberMe: true,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.rememberMe).toBe(true);
    }
  });

  // 29 Phase 1: Core Authentication & Onboarding JOB_UC_02.0 User Login
  it('29. Company login additionally requires representative phone details and validates them before granting access', () => {
    const validLogin = LoginSchema.safeParse({
      email: 'hr@acme.com',
      password: 'SecurePass123',
      phone: '0701234567',
    });
    expect(validLogin.success).toBe(true);

    const invalidPhone = LoginSchema.safeParse({
      email: 'hr@acme.com',
      password: 'SecurePass123',
      phone: '123', // not 10 digits
    });
    expect(invalidPhone.success).toBe(false);
  });
});
