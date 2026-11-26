'use client';

import { useEffect } from 'react';
import { getQueryClient } from '@/lib/query/client';
import { useAuthHint } from '@/lib/stores/auth-hint';
import { followDraftWipesFromOtherTabs, reconcileDraftOwner } from '@/lib/stores/clear-drafts';

// Renders nothing. Carries the server's answer to "who is signed in" into the
// client, for two jobs that used to need Clerk's browser SDK:
//
//  1. Components that show or hide something by auth state (the mobile menu's
//     links, the save-search button) read it from useAuthHint().
//  2. Locally persisted form drafts must never reach another person. This was
//     <DraftOwnerGuard>, which had to wait for clerk-js to load and then
//     guess that "not loaded yet" was not "signed out". The server's answer has
//     no such ambiguity, and arrives with the HTML instead of after a script.
//     The same goes for the browser's QueryClient, which lives as long as the
//     tab and which the header bell fills with notifications on every page.
//
// It is re-rendered with a new `userId` whenever the server components above it
// are (router.refresh() after sign-in / sign-out, a full load), which is
// exactly when the identity can have changed.
export function AuthHint({ userId }: { userId: string | null }) {
  const setUserId = useAuthHint((s) => s.setUserId);

  useEffect(() => {
    // Read from the store, not a ref, so a remount still sees who came before.
    const previous = useAuthHint.getState().userId;
    if (typeof previous === 'string' && previous !== userId) getQueryClient().clear();
    setUserId(userId);
    if (!userId) return;
    try {
      reconcileDraftOwner(userId);
    } catch {
      // localStorage can throw in some privacy modes; drafts are best-effort.
    }
  }, [userId, setUserId]);

  useEffect(() => followDraftWipesFromOtherTabs(), []);

  return null;
}
