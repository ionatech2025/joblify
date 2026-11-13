// The rule submitApplication enforces (app/actions/apply.ts): a job stops
// taking applications once its deadline instant has passed. Every surface that
// offers or hides the apply flow asks this, so none of them can disagree with
// the action that finally accepts or refuses the application.
export function applicationsClosed(deadline: Date | null, now = new Date()): boolean {
  return deadline !== null && deadline < now;
}

// Fixed locale and zone: no drift between servers or between server and client.
const deadlineFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

export function formatDeadline(deadline: Date): string {
  return deadlineFormat.format(deadline);
}
