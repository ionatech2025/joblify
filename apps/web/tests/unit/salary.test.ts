import { describe, it, expect } from 'vitest';
import { toAnnual, salaryOverlapWhere, ANNUAL_FACTOR } from '@/lib/search/salary';
import { formatSalary } from '@/lib/ui/salary';

describe('toAnnual', () => {
  it('annualises with the full-time conventions', () => {
    expect(toAnnual(1_000, 'MONTH')).toBe(12_000);
    expect(toAnnual(25, 'HOUR')).toBe(52_000);
    expect(toAnnual(50_000, 'YEAR')).toBe(50_000);
    expect(toAnnual(2_000, 'WEEK')).toBe(104_000);
    expect(toAnnual(300, 'DAY')).toBe(78_000);
  });
  it('passes null through and treats unknown/absent period as yearly', () => {
    expect(toAnnual(null, 'MONTH')).toBeNull();
    expect(toAnnual(40_000, undefined)).toBe(40_000);
    expect(ANNUAL_FACTOR.YEAR).toBe(1);
  });
});

describe('salaryOverlapWhere', () => {
  it('is null when there is no salary filter', () => {
    expect(salaryOverlapWhere(null, null)).toBeNull();
    expect(salaryOverlapWhere(undefined, 0)).toBeNull();
  });

  it('produces one branch per period with both bounds divided down', () => {
    const where = salaryOverlapWhere(120_000, 180_000)!;
    const month = (where.OR as Array<Record<string, unknown>>).find(
      (c) => c.salaryPeriod === 'MONTH',
    );
    expect(month).toEqual({
      salaryPeriod: 'MONTH',
      salaryMax: { gte: 10_000 },
      salaryMin: { lte: 15_000 },
    });
  });
});

describe('formatSalary', () => {
  it('says what the amount is per', () => {
    expect(formatSalary({ min: 3000000, max: 4500000, currency: 'UGX', period: 'MONTH' })).toBe(
      'UGX 3,000,000–4,500,000 per month',
    );
  });
  it('treats an index record without a period as yearly (it predates the field)', () => {
    expect(formatSalary({ min: 50000, max: 60000, currency: 'USD' })).toBe(
      'USD 50,000–60,000 per year',
    );
  });
  it('handles a one-sided range and no range', () => {
    expect(formatSalary({ min: 50000, max: null, currency: 'USD', period: 'YEAR' })).toBe(
      'USD 50,000 per year',
    );
    expect(formatSalary({ min: null, max: null, currency: 'USD' })).toBeNull();
  });
});
