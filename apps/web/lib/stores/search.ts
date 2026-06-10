import { create } from 'zustand';
import type { ExperienceLevel, JobType, WorkMode } from '@prisma/client';

// Client-side filter draft. The committed search is whatever's reflected in
// the URL (TanStack Query keys off it); this store holds the in-progress
// filter UI before the user clicks Apply.

export type SearchFilters = {
  query: string;
  location: string;
  workMode: WorkMode | null;
  jobType: JobType | null;
  experienceLevel: ExperienceLevel | null;
  salaryMin: number | null;
  radiusKm: number | null;
};

export const initialFilters: SearchFilters = {
  query: '',
  location: '',
  workMode: null,
  jobType: null,
  experienceLevel: null,
  salaryMin: null,
  radiusKm: null,
};

type SearchState = {
  draft: SearchFilters;
  setField: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  resetDraft: () => void;
  isDirty: () => boolean;
};

export const useSearchStore = create<SearchState>((set, get) => ({
  draft: initialFilters,
  setField: (key, value) => set((state) => ({ draft: { ...state.draft, [key]: value } })),
  resetDraft: () => set({ draft: initialFilters }),
  isDirty: () => {
    const { draft } = get();
    return (Object.keys(initialFilters) as Array<keyof SearchFilters>).some(
      (k) => draft[k] !== initialFilters[k],
    );
  },
}));
