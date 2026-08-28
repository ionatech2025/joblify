'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/app/components/ui/button';

/**
 * Submit button for one job-seeker profile type.
 *
 * The onboarding form posts straight to a Server Action, and that action does
 * real work before it redirects — a profile upsert, then a full page load of
 * /jobseeker/profile on the other side. Without a pending state the click had
 * no visible effect for the whole of it, and the button stayed live, so an
 * impatient second click fired the action twice.
 *
 * Both buttons share one form, so useFormStatus().pending is true for both.
 * `data` is the FormData React is submitting, which carries the name/value of
 * the button that was actually pressed — that is what tells the spinner which
 * of the two to sit on. The other one disables without spinning, which reads
 * as "not this one" rather than "everything is loading".
 */
export function ProfileTypeSubmit({
  value,
  variant = 'primary',
  children,
}: {
  value: 'EMPLOYABLE' | 'VIRTUAL_INTERN';
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}) {
  const { pending, data } = useFormStatus();
  const isThisButton = data?.get('profileType') === value;

  return (
    <Button
      type="submit"
      name="profileType"
      value={value}
      variant={variant}
      loading={pending && isThisButton}
      disabled={pending}
    >
      {children}
    </Button>
  );
}
