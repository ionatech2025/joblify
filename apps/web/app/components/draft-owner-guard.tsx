'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { reconcileDraftOwner } from '@/lib/stores/clear-drafts';

// Renders nothing. Keeps locally persisted form drafts from outliving the
// person who typed them: when the signed-in identity changes, or the session
// ends, every draft is wiped (see lib/stores/clear-drafts.ts for why).
//
// It waits for Clerk to finish loading: `userId` is undefined until then, and
// treating "not loaded yet" as "signed out" would erase a returning user's
// drafts on every page load.
export function DraftOwnerGuard() {
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    try {
      reconcileDraftOwner(userId ?? null);
    } catch {
      // localStorage can throw in some privacy modes; drafts are best-effort.
    }
  }, [isLoaded, userId]);

  return null;
}
