import { describe, it, expect } from 'vitest';
import { isValidPhone, normalizePhone, optionalPhone, PHONE_MESSAGE } from '@/lib/validation/phone';
import { endsBeforeStart } from '@/lib/resume/date-order';
import { ProfileSchema } from '@/app/actions/profile-schema';

describe('phone', () => {
  it('accepts what people and browsers actually type', () => {
    for (const ok of [
      '0743535678',
      '+256 743 535 678',
      '+256-743-535-678',
      '(0743) 535 678',
      '+1 (415) 555-0132',
      '256743535678',
      '5551234', // 7 digits
    ]) {
      expect(isValidPhone(ok), ok).toBe(true);
    }
  });

  it('rejects things that are not phone numbers', () => {
    for (const bad of [
      '',
      'call me',
      '12345',
      '+',
      '0743 abc 678',
      '1'.repeat(16),
      '++256743535678',
    ]) {
      expect(isValidPhone(bad), bad).toBe(false);
    }
  });

  it('normalises to "+" and digits', () => {
    expect(normalizePhone(' +256 (743) 535-678 ')).toBe('+256743535678');
    expect(normalizePhone('0743.535.678')).toBe('0743535678');
  });

  it('is optional, and stores the normalised form', () => {
    expect(optionalPhone.parse('')).toBe('');
    expect(optionalPhone.parse(undefined)).toBeUndefined();
    expect(optionalPhone.parse('+256 743 535 678')).toBe('+256743535678');
    const bad = optionalPhone.safeParse('nope');
    expect(bad.success).toBe(false);
    if (!bad.success) expect(bad.error.issues[0]?.message).toBe(PHONE_MESSAGE);
  });

  it('is the rule the profile server schema enforces', () => {
    const base = {
      profileType: 'EMPLOYABLE',
      visibility: 'PRIVATE',
      skillSlugs: ['x'],
      bio: 'b',
      education: 'e',
    };
    const ok = ProfileSchema.safeParse({ ...base, phone: '+256 743 535 678' });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.phone).toBe('+256743535678');
    expect(ProfileSchema.safeParse({ ...base, phone: 'call me' }).success).toBe(false);
  });
});

describe('work-experience date order', () => {
  it('flags an end year before the start year, whatever the spelling', () => {
    expect(endsBeforeStart('Jan 2022', 'Mar 2020')).toBe(true);
    expect(endsBeforeStart('2022', '2021')).toBe(true);
    expect(endsBeforeStart('03/2022', 'June 2019')).toBe(true);
  });

  it('does not flag what it cannot compare, or a correct order', () => {
    expect(endsBeforeStart('Jan 2020', 'Present')).toBe(false);
    expect(endsBeforeStart('Jan 2020', '')).toBe(false);
    expect(endsBeforeStart('', 'Mar 2020')).toBe(false);
    expect(endsBeforeStart('Summer', 'Winter')).toBe(false);
    expect(endsBeforeStart('2020', '2020')).toBe(false);
    expect(endsBeforeStart('Jan 2020', 'Dec 2024')).toBe(false);
    expect(endsBeforeStart(undefined, null)).toBe(false);
  });
});
