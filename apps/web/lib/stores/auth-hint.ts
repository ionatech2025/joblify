import { create } from 'zustand';

// What the server knows about the visitor, for the few client components that
// need it but must not load Clerk's browser SDK to find out.
//
// It is written by <AuthHint> (app/components/auth-hint.tsx), which the header's
// server island renders from `auth()`. That island runs on every page, so by the
// time anything reads this it is the same answer the server just gave — and
// unlike clerk-js it costs no script, no cookies set on a third-party origin and
// no round trips to the Clerk frontend API.
type AuthHintState = {
  /** `undefined` until the server's answer has arrived; `null` when signed out. */
  userId: string | null | undefined;
  setUserId: (userId: string | null) => void;
};

export const useAuthHint = create<AuthHintState>()((set) => ({
  userId: undefined,
  setUserId: (userId) => set({ userId }),
}));
