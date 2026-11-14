const DAY_MS = 24 * 60 * 60 * 1000;

// A deadline is a calendar date, stored at UTC midnight of that day. "Apply by
// Nov 14" means applications stay open through all of Nov 14 (UTC), so a job
// closes one day after the stored instant, not at it.
export function applicationsClosed(deadline: Date | null | undefined, now = new Date()): boolean {
  return deadline != null && now.getTime() >= deadline.getTime() + DAY_MS;
}

/** Prisma `where` fragment: no deadline, or one that is still open. */
export function openDeadlineWhere(now = new Date()) {
  return {
    OR: [
      { applicationDeadline: null },
      { applicationDeadline: { gt: new Date(now.getTime() - DAY_MS) } },
    ],
  };
}

const deadlineFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

export function formatDeadline(deadline: Date): string {
  return deadlineFormat.format(deadline);
}
