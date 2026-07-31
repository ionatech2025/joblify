import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CompanyProfileInput } from '@/app/company/company-profile-schema';

// Employer setup ("create your company") form draft. Survives accidental
// navigation (back button, closed tab); cleared on successful create. Flat
// shape — one company-creation flow at a time, so no keying is needed.
//
// Deliberately a separate store/localStorage key from company-settings-draft:
// same field shape, but a different form and a different context (a company
// could in principle start this draft, finish setup, and later start an
// unrelated settings-edit draft — the two shouldn't collide).

export type EmployerSetupDraft = Partial<CompanyProfileInput>;

type EmployerSetupDraftState = {
  draft: EmployerSetupDraft;
  update: (patch: EmployerSetupDraft) => void;
  clear: () => void;
};

export const useEmployerSetupDraftStore = create<EmployerSetupDraftState>()(
  persist(
    (set) => ({
      draft: {},
      update: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
      clear: () => set({ draft: {} }),
    }),
    {
      name: 'joblify.employer-setup-draft',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
