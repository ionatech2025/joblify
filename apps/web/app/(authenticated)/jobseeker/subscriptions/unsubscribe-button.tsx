'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ProfileType } from '@prisma/client';
import { unsubscribeFromCompany } from '@/app/actions/subscriptions';
import { Button } from '@/app/components/ui/button';
import { toast } from '@/lib/stores/ui';

export function UnsubscribeButton({
  companyId,
  profileType,
  companyName,
}: {
  companyId: string;
  profileType: ProfileType;
  companyName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(`Unsubscribe from ${companyName}? You can re-subscribe any time.`)) {
      return;
    }
    startTransition(async () => {
      try {
        await unsubscribeFromCompany(companyId, profileType);
        toast.success('Unsubscribed');
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        toast.error("Couldn't unsubscribe", message);
      }
    });
  }

  return (
    <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={onClick}>
      Unsubscribe
    </Button>
  );
}
