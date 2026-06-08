import { describe, expect, it, beforeEach } from 'vitest';
import { useSearchStore, initialFilters } from '@/lib/stores/search';

describe('search store', () => {
  beforeEach(() => {
    useSearchStore.getState().resetDraft();
  });

  it('starts clean', () => {
    expect(useSearchStore.getState().draft).toEqual(initialFilters);
    expect(useSearchStore.getState().isDirty()).toBe(false);
  });

  it('marks dirty after a field is set', () => {
    useSearchStore.getState().setField('query', 'engineer');
    expect(useSearchStore.getState().draft.query).toBe('engineer');
    expect(useSearchStore.getState().isDirty()).toBe(true);
  });

  it('resets to clean', () => {
    useSearchStore.getState().setField('query', 'engineer');
    useSearchStore.getState().setField('workMode', 'REMOTE');
    useSearchStore.getState().resetDraft();
    expect(useSearchStore.getState().draft).toEqual(initialFilters);
    expect(useSearchStore.getState().isDirty()).toBe(false);
  });
});
