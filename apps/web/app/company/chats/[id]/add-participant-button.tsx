'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addChatParticipant } from '@/app/actions/chat';
import { Button } from '@/app/components/ui/button';
import { toast } from '@/lib/stores/ui';

export function AddParticipantButton({
  chatAreaId,
  jobSeekerUserId,
}: {
  chatAreaId: string;
  jobSeekerUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      try {
        await addChatParticipant(chatAreaId, jobSeekerUserId);
        toast.success('Added to chat');
        // Server-rendered participant/candidate lists — refresh to move this
        // seeker from one to the other.
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        toast.error("Couldn't add participant", message);
      }
    });
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={onClick} disabled={isPending}>
      Add
    </Button>
  );
}
