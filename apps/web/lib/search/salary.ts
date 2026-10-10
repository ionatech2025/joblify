import type { Prisma, SalaryPeriod } from '@prisma/client';

/**
 * Pay is stored as the employer entered it (`salaryMin`/`salaryMax` + a
 * `salaryPeriod`). Comparing those raw numbers across rows — which is what the
 * search filters used to do — ranks "30 000 per month" below "40 000 per year".
 * Everything that filters or sorts on pay goes through the annualised form.
 *
 * The factors are the conventional full-time year: 40 h × 52 w = 2 080 h,
 * 5 d × 52 w ≈ 260 d. They are for *comparison*, never for display.
 */
export const ANNUAL_FACTOR: Record<SalaryPeriod, number> = {
  HOUR: 2080,
  DAY: 260,
  WEEK: 52,
  MONTH: 12,
  YEAR: 1,
};

const PERIODS = Object.keys(ANNUAL_FACTOR) as SalaryPeriod[];

export function toAnnual(
  amount: number | null | undefined,
  period: SalaryPeriod | string | null | undefined,
): number | null {
  if (amount === null || amount === undefined) return null;
  const factor = ANNUAL_FACTOR[(period ?? 'YEAR') as SalaryPeriod] ?? 1;
  return Math.round(amount * factor);
}

/**
 * Prisma fragment: the job's (annualised) pay range overlaps [min, max].
 * Expressed per period so it stays a plain `where` — no raw SQL — by dividing
 * the caller's annual bounds back down by each period's factor.
 */
export function salaryOverlapWhere(
  min?: number | null,
  max?: number | null,
): Prisma.JobPostWhereInput | null {
  if (!min && !max) return null;
  return {
    OR: PERIODS.map((period) => {
      const k = ANNUAL_FACTOR[period];
      const cond: Prisma.JobPostWhereInput = { salaryPeriod: period };
      if (min) cond.salaryMax = { gte: Math.ceil(min / k) };
      if (max) cond.salaryMin = { lte: Math.floor(max / k) };
      return cond;
    }),
  };
}
