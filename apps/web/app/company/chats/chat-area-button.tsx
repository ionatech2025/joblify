'use client';

import { useTransition } from 'react';
import { openJobChatArea, openVirtualInternChatArea } from '@/app/actions/chat';
import { Button } from '@/app/components/ui/button';
import { toast } from '@/lib/stores/ui';

type Props = { kind: 'virtual-intern' } | { kind: 'job'; jobPostId: string };

// Both actions redirect into the freshly created chat area on success, so
// there's no meaningful "success" moment to toast — the navigation itself is
// the confirmation. Only failures (rate limits, the PRO plan gate) need to
// surface here instead of crashing to the full-page error boundary.
export function ChatAreaButton(props: Props) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      try {
        if (props.kind === 'virtual-intern') {
          await openVirtualInternChatArea();
        } else {
          await openJobChatArea(props.jobPostId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        toast.error("Couldn't create the chat area", message);
      }
    });
  }

  if (props.kind === 'virtual-intern') {
    return (
      <Button type="button" onClick={onClick} disabled={isPending}>
        Create virtual-intern chat area
      </Button>
    );
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={onClick} disabled={isPending}>
      Create chat area
    </Button>
  );
}
