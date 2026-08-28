'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ProfileType } from '@prisma/client';
import { subscribeToCompany, unsubscribeFromCompany } from '@/app/actions/subscriptions';
import { Button } from '@/app/components/ui/button';
import { toast } from '@/lib/stores/ui';
import { unwrap } from '@/lib/action-result';

export function SubscribeToggle({
  companyUserId,
  profileType,
  initialSubscribed,
}: {
  companyUserId: string;
  profileType: ProfileType;
  initialSubscribed: boolean;
}) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [isPending, startTransition] = useTransition();
  const typeLabel = profileType === 'VIRTUAL_INTERN' ? 'virtual intern' : 'employable';

  function onClick() {
    if (
      subscribed &&
      !window.confirm(`Unsubscribe as ${typeLabel}? You can re-subscribe any time.`)
    ) {
      return;
    }
    const next = !subscribed;
    setSubscribed(next);
    startTransition(async () => {
      try {
        if (next) {
          unwrap(await subscribeToCompany(companyUserId, profileType));
          toast.success(`Subscribed as ${typeLabel}`);
        } else {
          await unsubscribeFromCompany(companyUserId, profileType);
          toast.success('Unsubscribed');
        }
      } catch (err) {
        setSubscribed(!next);
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        toast.error(next ? "Couldn't subscribe" : "Couldn't unsubscribe", message);
      }
    });
  }

  if (subscribed) {
    return (
      <Button
        type="button"
        variant="secondary"
        onClick={onClick}
        disabled={isPending}
        icon={<CheckCircle2 aria-hidden className="size-4 text-success" />}
        iconPosition="end"
      >
        Subscribed as {typeLabel} — unsubscribe
      </Button>
    );
  }

  return (
    <Button type="button" onClick={onClick} disabled={isPending}>
      Subscribe as {typeLabel}
    </Button>
  );
}
