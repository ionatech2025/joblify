import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Multi-step apply form draft. Survives accidental navigation; cleared on
// successful submit. Per-job key so two open tabs don't collide.

export type ApplyDraft = {
  resumeId: string | null;
  coverLetter: string;
  acknowledgedDataUse: boolean;
};

const blank: ApplyDraft = {
  resumeId: null,
  coverLetter: '',
  acknowledgedDataUse: false,
};

type ApplyDraftState = {
  byJob: Record<string, ApplyDraft>;
  get: (jobId: string) => ApplyDraft;
  update: (jobId: string, patch: Partial<ApplyDraft>) => void;
  clear: (jobId: string) => void;
};

export const useApplyDraftStore = create<ApplyDraftState>()(
  persist(
    (set, get) => ({
      byJob: {},
      get: (jobId) => get().byJob[jobId] ?? blank,
      update: (jobId, patch) =>
        set((state) => ({
          byJob: {
            ...state.byJob,
            [jobId]: { ...(state.byJob[jobId] ?? blank), ...patch },
          },
        })),
      clear: (jobId) =>
        set((state) => {
          const { [jobId]: _drop, ...rest } = state.byJob;
          return { byJob: rest };
        }),
    }),
    {
      name: 'joblify.apply-draft',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
