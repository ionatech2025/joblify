'use client';

import { useId, useState, useTransition } from 'react';
import { setDigestOptIn } from '@/app/actions/email-preferences';
import { unwrap } from '@/lib/action-result';
import { toast } from '@/lib/stores/ui';

/**
 * The only place the daily jobs digest is switched ON.
 *
 * Off by default and never inferred from anything else (the cookie banner used
 * to enrol people by accident). Every digest email also carries a one-click
 * unsubscribe that flips this back off.
 */
export function DigestPreference({
  initialOptIn,
  addressSuppressed,
}: {
  initialOptIn: boolean;
  addressSuppressed: boolean;
}) {
  const id = useId();
  const [optIn, setOptIn] = useState(initialOptIn);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    const previous = optIn;
    setOptIn(next); // optimistic
    startTransition(async () => {
      try {
        unwrap(await setDigestOptIn(next));
        toast.success(next ? 'Daily digest turned on' : 'Daily digest turned off');
      } catch (err) {
        setOptIn(previous);
        toast.error(
          "Couldn't update your email preference",
          err instanceof Error ? err.message : 'Please try again.',
        );
      }
    });
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="o-sheet mb-3 flex items-start gap-3 px-4 py-3"
    >
      <input
        id={id}
        type="checkbox"
        checked={optIn}
        disabled={pending || (addressSuppressed && !optIn)}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 shrink-0"
      />
      <div className="min-w-0">
        <label id={`${id}-title`} htmlFor={id} className="text-fg text-[13px] font-semibold">
          Email me a daily digest of new jobs
        </label>
        <p className="text-fg-muted mt-0.5 mb-0 text-[12px]">
          One email a day, at most, when there are new roles that match your saved searches. Off
          unless you turn it on, and every email has a one-click unsubscribe. Account and
          application emails are separate and are not affected.
        </p>
        {addressSuppressed && (
          <p className="text-danger mt-1 mb-0 text-[12px]">
            Messages to your address were rejected or reported as spam, so we cannot email you until
            you update it.
          </p>
        )}
      </div>
    </section>
  );
}
