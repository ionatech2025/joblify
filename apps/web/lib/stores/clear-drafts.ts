import { useApplyDraftStore } from './apply-draft';
import { useCompanySettingsDraftStore } from './company-settings-draft';
import { useEmployerSetupDraftStore } from './employer-setup-draft';
import { usePostJobDraftStore } from './post-job-draft';
import { useProfileDraftStore } from './profile-draft';

/**
 * Wipe every persisted form draft — in memory AND in localStorage.
 *
 * Drafts hold what a person was in the middle of typing: name, phone, bio,
 * salary expectations, cover letters. They are stored under fixed, unkeyed
 * localStorage names, so on a shared computer (an internet café, a library) the
 * next person to sign in saw the previous person's unsaved profile restored
 * over their own, and nothing ever cleared it.
 *
 * Drafts are wiped when a different person signs in (reconcileDraftOwner) and
 * on an explicit sign-out (clearDraftsOnSignOut), and are restored only to
 * their owner (ownsDrafts). A signed-out render keeps them: a session that
 * expires mid-form lands on /sign-in, which renders signed out, and clearing
 * there erased the work the person was about to sign back in to submit. The
 * cost: after an expiry nobody signs back in from, the drafts stay in this
 * browser's localStorage until the next sign-in. No one else is shown them,
 * but someone with the browser's developer tools could read them.
 *
 * Both layers are cleared: removing the keys alone would leave the live zustand
 * state in memory, which the next write would just persist again.
 */
export const DRAFT_STORAGE_KEY = /^joblify\..+-draft$/;
export const DRAFT_OWNER_KEY = 'joblify.draft-owner';

function clearDraftMemory(): void {
  useProfileDraftStore.getState().clear();
  usePostJobDraftStore.getState().clear();
  useEmployerSetupDraftStore.getState().clear();
  useCompanySettingsDraftStore.getState().clear();
  const apply = useApplyDraftStore.getState();
  for (const jobId of Object.keys(apply.byJob)) apply.clear(jobId);
}

export function clearAllDrafts(storage: Storage = localStorage): void {
  clearDraftMemory();

  // Anything a (possibly older) build persisted under a *-draft name.
  const stale: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && DRAFT_STORAGE_KEY.test(key)) stale.push(key);
  }
  for (const key of stale) storage.removeItem(key);
}

/**
 * Whether the stored drafts belong to the person signed in right now. clerk-js,
 * once loaded, learns of a sign-in before the server-rendered hint refreshes,
 * so it wins; without it no sign-in can have happened in this tab, so the hint
 * is current. Unreadable storage counts as not owned.
 */
export function ownsDrafts(hintUserId: string | null | undefined): boolean {
  const clerk = (window as { Clerk?: { loaded?: boolean; user?: { id: string } | null } }).Clerk;
  const userId = clerk?.loaded ? clerk.user?.id : hintUserId;
  try {
    return !!userId && localStorage.getItem(DRAFT_OWNER_KEY) === userId;
  } catch {
    return false;
  }
}

type SignOut = (...args: never[]) => Promise<unknown>;

/** Wraps a Clerk instance's signOut to wipe every draft first. Returns the unwrap. */
export function clearDraftsOnSignOut(
  clerk: { signOut: SignOut },
  storage: Storage = localStorage,
): () => void {
  const signOut = clerk.signOut;
  clerk.signOut = (...args) => {
    try {
      clearAllDrafts(storage);
      storage.removeItem(DRAFT_OWNER_KEY);
    } catch {
      // localStorage can throw in some privacy modes; the sign-out must still happen.
    }
    return signOut(...args);
  };
  return () => {
    clerk.signOut = signOut;
  };
}

/**
 * Another tab wipes the stored drafts on sign-out or a different sign-in, but
 * this tab still holds them in memory, where the next restore or write would
 * bring them back. This follows that tab. Clearing memory writes empty drafts,
 * which other tabs ignore, so two tabs cannot set each other off. Returns the
 * unsubscribe.
 */
export function followDraftWipesFromOtherTabs(): () => void {
  const onStorage = ({ key, newValue }: StorageEvent) => {
    const wiped =
      key === null || key === DRAFT_OWNER_KEY || (DRAFT_STORAGE_KEY.test(key) && newValue === null);
    if (wiped) clearDraftMemory();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

/** Reconcile drafts with the signed-in user. Returns true when drafts were cleared. */
export function reconcileDraftOwner(userId: string, storage: Storage = localStorage): boolean {
  if (storage.getItem(DRAFT_OWNER_KEY) === userId) return false;
  clearAllDrafts(storage);
  storage.setItem(DRAFT_OWNER_KEY, userId);
  return true;
}
