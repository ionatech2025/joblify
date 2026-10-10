'use client';

import { useEffect } from 'react';
import { useAuthHint } from '@/lib/stores/auth-hint';
import { reconcileDraftOwner } from '@/lib/stores/clear-drafts';

// Renders nothing. Carries the server's answer to "who is signed in" into the
// client, for two jobs that used to need Clerk's browser SDK:
//
//  1. Components that show or hide something by auth state (the mobile menu's
//     links, the save-search button) read it from useAuthHint().
//  2. Locally persisted form drafts must not outlive the person who typed
//     them: when the signed-in identity changes, or the session ends, every
//     draft is wiped (lib/stores/clear-drafts.ts explains why). This was
//     <DraftOwnerGuard>, which had to wait for clerk-js to load and then
//     guess that "not loaded yet" was not "signed out". The server's answer has
//     no such ambiguity, and arrives with the HTML instead of after a script.
//
// It is re-rendered with a new `userId` whenever the server components above it
// are (router.refresh() after sign-in / sign-out, a full load), which is
// exactly when the identity can have changed.
export function AuthHint({ userId }: { userId: string | null }) {
  const setUserId = useAuthHint((s) => s.setUserId);

  useEffect(() => {
    setUserId(userId);
    try {
      reconcileDraftOwner(userId);
    } catch {
      // localStorage can throw in some privacy modes; drafts are best-effort.
    }
  }, [userId, setUserId]);

  return null;
}
