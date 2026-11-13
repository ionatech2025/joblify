export function applicationsClosed(deadline: Date | null, now = new Date()): boolean {
  return deadline !== null && deadline < now;
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
