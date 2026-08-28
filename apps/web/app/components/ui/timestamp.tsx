'use client';

import { useHydrated } from '@/lib/use-hydrated';

/**
 * A rendered date or date+time.
 *
 * Replaces 26 bare `toLocaleDateString()` / `toLocaleString()` calls, which had
 * two problems:
 *
 *   1. With no locale argument the result depends on where the code runs. On
 *      the server that is the Vercel function's locale and **UTC**; on the
 *      client it is the viewer's locale and zone. Five of those calls were in
 *      client components, so they rendered one string during SSR and a
 *      different one at hydration — a mismatch React has to patch on every
 *      affected page.
 *   2. Even where it wasn't a mismatch it was wrong: a recruiter in Auckland
 *      saw applications dated the previous day, because the server rendered
 *      UTC for everyone.
 *
 * The fix is to render a stable, explicit UTC string on the server and upgrade
 * to the viewer's own zone once hydrated. `dateTime` carries the unambiguous
 * instant either way, so the timestamp is machine-readable to assistive tech
 * and crawlers — there were zero `<time>` elements in the app before this.
 *
 * `suppressHydrationWarning` is correct rather than a paper-over: the two
 * renders differ by design, and only the text node differs.
 */
export function TimeStamp({
  value,
  mode = 'date',
  className,
}: {
  /** An ISO string, or a Date (server components may pass Prisma values). */
  value: string | Date;
  /** `date` for list columns and metadata, `datetime` for chat and activity. */
  mode?: 'date' | 'datetime';
  className?: string;
}) {
  const hydrated = useHydrated();
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const iso = date.toISOString();
  const options: Intl.DateTimeFormatOptions =
    mode === 'datetime' ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' };

  // Pre-hydration: a fixed locale and zone, so server and first client render
  // agree byte for byte. Post-hydration: the viewer's own.
  const text = hydrated
    ? new Intl.DateTimeFormat(undefined, options).format(date)
    : new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(date);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
