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
 * over their own, and nothing ever cleared it. The guard that calls this does
 * so whenever the signed-in identity changes or ends.
 *
 * Both layers are cleared: removing the keys alone would leave the live zustand
 * state in memory, which the next write would just persist again.
 */
export const DRAFT_STORAGE_KEY = /^joblify\..+-draft$/;
export const DRAFT_OWNER_KEY = 'joblify.draft-owner';

export function clearAllDrafts(storage: Storage = localStorage): void {
  useProfileDraftStore.getState().clear();
  usePostJobDraftStore.getState().clear();
  useEmployerSetupDraftStore.getState().clear();
  useCompanySettingsDraftStore.getState().clear();
  const apply = useApplyDraftStore.getState();
  for (const jobId of Object.keys(apply.byJob)) apply.clear(jobId);

  // Anything a (possibly older) build persisted under a *-draft name.
  const stale: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && DRAFT_STORAGE_KEY.test(key)) stale.push(key);
  }
  for (const key of stale) storage.removeItem(key);
}

/**
 * Reconcile drafts with the signed-in user. Returns true when drafts were
 * cleared. `userId === null` means signed out.
 */
export function reconcileDraftOwner(
  userId: string | null,
  storage: Storage = localStorage,
): boolean {
  const owner = storage.getItem(DRAFT_OWNER_KEY);
  if (!userId) {
    if (owner === null) return false;
    clearAllDrafts(storage);
    storage.removeItem(DRAFT_OWNER_KEY);
    return true;
  }
  if (owner === userId) return false;
  clearAllDrafts(storage);
  storage.setItem(DRAFT_OWNER_KEY, userId);
  return true;
}
