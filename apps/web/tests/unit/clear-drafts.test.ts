// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { clearAllDrafts, reconcileDraftOwner, DRAFT_OWNER_KEY } from '@/lib/stores/clear-drafts';
import { useProfileDraftStore } from '@/lib/stores/profile-draft';
import { useApplyDraftStore } from '@/lib/stores/apply-draft';

// Drafts hold unsaved PII (name, phone, bio, cover letters) under fixed,
// unkeyed localStorage names. On a shared computer the next sign-in must not
// inherit them — in memory OR in storage.

beforeEach(() => {
  localStorage.clear();
  useProfileDraftStore.setState({ draft: {} });
  useApplyDraftStore.setState({ byJob: {} });
});

describe('reconcileDraftOwner', () => {
  it('wipes the previous user’s drafts when a different user signs in', () => {
    reconcileDraftOwner('alice');
    useProfileDraftStore.getState().update({ headline: 'Alice’s unsaved headline', phone: '0700' });
    useApplyDraftStore.getState().update('job-1', { coverLetter: 'Dear hiring manager…' });
    expect(localStorage.getItem('joblify.profile-draft')).toContain('Alice');

    const cleared = reconcileDraftOwner('bob');

    expect(cleared).toBe(true);
    expect(useProfileDraftStore.getState().draft).toEqual({}); // in memory…
    expect(useApplyDraftStore.getState().byJob).toEqual({});
    expect(localStorage.getItem('joblify.profile-draft') ?? '').not.toContain('Alice'); // …and in storage
    expect(localStorage.getItem(DRAFT_OWNER_KEY)).toBe('bob');
  });

  it('keeps a returning user’s drafts', () => {
    reconcileDraftOwner('alice');
    useProfileDraftStore.getState().update({ headline: 'keep me' });
    expect(reconcileDraftOwner('alice')).toBe(false);
    expect(useProfileDraftStore.getState().draft.headline).toBe('keep me');
  });

  it('wipes everything on sign-out', () => {
    reconcileDraftOwner('alice');
    useProfileDraftStore.getState().update({ headline: 'secret' });
    expect(reconcileDraftOwner(null)).toBe(true);
    expect(useProfileDraftStore.getState().draft).toEqual({});
    expect(localStorage.getItem(DRAFT_OWNER_KEY)).toBeNull();
  });

  it('does nothing for an anonymous visitor with no draft owner', () => {
    expect(reconcileDraftOwner(null)).toBe(false);
  });
});

describe('clearAllDrafts', () => {
  it('also removes any other *-draft key an older build left behind', () => {
    localStorage.setItem('joblify.legacy-form-draft', '{"x":1}');
    localStorage.setItem('joblify.consent', 'all'); // not a draft — must survive
    clearAllDrafts();
    expect(localStorage.getItem('joblify.legacy-form-draft')).toBeNull();
    expect(localStorage.getItem('joblify.consent')).toBe('all');
  });
});
