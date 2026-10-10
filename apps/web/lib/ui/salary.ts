export type SalaryPeriodKey = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

const SUFFIX: Record<SalaryPeriodKey, string> = {
  HOUR: 'per hour',
  DAY: 'per day',
  WEEK: 'per week',
  MONTH: 'per month',
  YEAR: 'per year',
};

/**
 * "USD 30,000–45,000 per year". `period` is optional because search records
 * indexed before the pay-period field existed do not carry one; those were all
 * entered as annual figures, so YEAR is the truthful reading.
 */
export function formatSalary(opts: {
  min: number | null | undefined;
  max: number | null | undefined;
  currency: string;
  period?: string | null;
}): string | null {
  const { min, max, currency } = opts;
  if (!min && !max) return null;
  const period = (opts.period && opts.period in SUFFIX ? opts.period : 'YEAR') as SalaryPeriodKey;
  const fmt = (n: number) => n.toLocaleString('en-US');
  const amount = min && max ? `${fmt(min)}–${fmt(max)}` : fmt((min ?? max) as number);
  return `${currency} ${amount} ${SUFFIX[period]}`;
}
