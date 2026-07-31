import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProfileFormValues } from '@/app/(authenticated)/jobseeker/profile/profile-form';

// Jobseeker profile form draft. Survives accidental navigation (back button,
// closed tab); cleared on successful save. Flat shape — a user has exactly one
// profile, so no keying is needed.

export type ProfileDraft = Partial<ProfileFormValues>;

type ProfileDraftState = {
  draft: ProfileDraft;
  update: (patch: ProfileDraft) => void;
  clear: () => void;
};

export const useProfileDraftStore = create<ProfileDraftState>()(
  persist(
    (set) => ({
      draft: {},
      update: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
      clear: () => set({ draft: {} }),
    }),
    {
      name: 'joblify.profile-draft',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
