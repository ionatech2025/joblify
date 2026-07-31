import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CompanyProfileInput } from '@/app/company/company-profile-schema';

// Company settings ("edit your company") form draft. Survives accidental
// navigation (back button, closed tab); cleared on successful save. Flat
// shape — one company-settings edit at a time, so no keying is needed.
//
// Deliberately a separate store/localStorage key from employer-setup-draft:
// same field shape, but a different form and a different context — see the
// note in employer-setup-draft.ts. The logo upload on this form is a separate
// useState-managed flow and is not part of this draft.

export type CompanySettingsDraft = Partial<CompanyProfileInput>;

type CompanySettingsDraftState = {
  draft: CompanySettingsDraft;
  update: (patch: CompanySettingsDraft) => void;
  clear: () => void;
};

export const useCompanySettingsDraftStore = create<CompanySettingsDraftState>()(
  persist(
    (set) => ({
      draft: {},
      update: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
      clear: () => set({ draft: {} }),
    }),
    {
      name: 'joblify.company-settings-draft',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
