// Work-experience dates are free text, so the only order check that holds for
// every spelling is on the years inside them. Anything without a recognisable
// year ("Summer", "") is not an error — it is just not comparable.

const YEAR = /\b(19|20)\d{2}\b/;

function yearOf(value: string | undefined | null): number | null {
  const m = value ? YEAR.exec(value) : null;
  return m ? Number(m[0]) : null;
}

/**
 * True when both dates carry a year and the end year is earlier than the start
 * year. "Present"/"Current" and a blank end are never "before".
 */
export function endsBeforeStart(
  start: string | undefined | null,
  end: string | undefined | null,
): boolean {
  const s = yearOf(start);
  const e = yearOf(end);
  return s !== null && e !== null && e < s;
}
