'use client';

import { useTransition } from 'react';
import type { ProfileType } from '@prisma/client';
import { addVirtualInternToChat } from '@/app/actions/chat';
import { inviteJobseeker } from '@/app/actions/invitations';
import { Button } from '@/app/components/ui/button';
import { toast } from '@/lib/stores/ui';

export function InviteButtons({
  jobSeekerUserId,
  profileType,
  subscribed,
}: {
  jobSeekerUserId: string;
  profileType: ProfileType;
  subscribed: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function onAddToChat() {
    startTransition(async () => {
      try {
        await addVirtualInternToChat(jobSeekerUserId);
        toast.success('Added to virtual-intern chat');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        toast.error("Couldn't add to chat", message);
      }
    });
  }

  function onInvite() {
    startTransition(async () => {
      try {
        // Daily rate-limit and plan-gate failures throw here and must reach
        // the user as a toast instead of the full-page error boundary.
        await inviteJobseeker(jobSeekerUserId, profileType);
        toast.success('Invitation sent');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        toast.error("Couldn't send the invitation", message);
      }
    });
  }

  return (
    <>
      {profileType === 'VIRTUAL_INTERN' && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAddToChat}
          disabled={isPending}
        >
          Add to VI chat
        </Button>
      )}
      {!subscribed && (
        <Button type="button" variant="secondary" size="sm" onClick={onInvite} disabled={isPending}>
          Invite as {profileType === 'VIRTUAL_INTERN' ? 'VI' : 'employable'}
        </Button>
      )}
    </>
  );
}
