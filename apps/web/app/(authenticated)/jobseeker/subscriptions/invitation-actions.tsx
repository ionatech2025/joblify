'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { respondToInvitation } from '@/app/actions/invitations';
import { Button } from '@/app/components/ui/button';
import { toast } from '@/lib/stores/ui';
import { unwrap } from '@/lib/action-result';

export function InvitationActions({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function respond(response: 'ACCEPT' | 'DECLINE') {
    startTransition(async () => {
      try {
        unwrap(await respondToInvitation(invitationId, response));
        toast.success(response === 'ACCEPT' ? 'Invitation accepted' : 'Invitation declined');
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        toast.error("Couldn't respond to the invitation", message);
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" disabled={isPending} onClick={() => respond('ACCEPT')}>
        Accept
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isPending}
        onClick={() => respond('DECLINE')}
      >
        Decline
      </Button>
    </div>
  );
}
