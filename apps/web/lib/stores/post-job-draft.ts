import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PostJobFormValues } from '@/app/company/jobs/job-form-schema';

// "Post a new job" form draft. Survives accidental navigation (back button,
// closed tab); cleared on successful submit. Flat shape — unlike the apply-draft
// store, there's only ever one in-progress "new job" draft at a time, so no
// keying is needed.

export type PostJobDraft = Partial<PostJobFormValues>;

type PostJobDraftState = {
  draft: PostJobDraft;
  update: (patch: PostJobDraft) => void;
  clear: () => void;
};

export const usePostJobDraftStore = create<PostJobDraftState>()(
  persist(
    (set) => ({
      draft: {},
      update: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
      clear: () => set({ draft: {} }),
    }),
    {
      name: 'joblify.post-job-draft',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
