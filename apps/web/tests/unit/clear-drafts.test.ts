// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import {
  clearAllDrafts,
  clearDraftsOnSignOut,
  reconcileDraftOwner,
  DRAFT_OWNER_KEY,
} from '@/lib/stores/clear-drafts';
import { AuthHint } from '@/app/components/auth-hint';
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

afterEach(cleanup);

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
});

describe('<AuthHint> across an expired session', () => {
  const header = (userId: string | null) => createElement(AuthHint, { userId });

  it('keeps drafts through the signed-out render, so the same user signs back in to them', () => {
    const { rerender } = render(header('alice'));
    useProfileDraftStore.getState().update({ headline: 'half-typed' });
    useApplyDraftStore.getState().update('job-1', { coverLetter: 'Dear hiring manager…' });

    rerender(header(null));
    rerender(header('alice'));

    expect(useProfileDraftStore.getState().draft.headline).toBe('half-typed');
    expect(useApplyDraftStore.getState().get('job-1').coverLetter).toBe('Dear hiring manager…');
    expect(localStorage.getItem('joblify.profile-draft')).toContain('half-typed');
  });

  it('still wipes them when someone else signs in after the signed-out render', () => {
    const { rerender } = render(header('alice'));
    useProfileDraftStore.getState().update({ headline: 'Alice’s secret' });

    rerender(header(null));
    rerender(header('bob'));

    expect(useProfileDraftStore.getState().draft).toEqual({});
    expect(localStorage.getItem('joblify.profile-draft') ?? '').not.toContain('Alice');
    expect(localStorage.getItem(DRAFT_OWNER_KEY)).toBe('bob');
  });
});

describe('clearDraftsOnSignOut', () => {
  it('wipes every draft and the owner before an explicit sign-out goes ahead', async () => {
    reconcileDraftOwner('alice');
    useProfileDraftStore.getState().update({ headline: 'secret', phone: '0700' });
    const signOut = vi.fn(async () => {
      expect(useProfileDraftStore.getState().draft).toEqual({});
    });
    const clerk = { signOut };
    clearDraftsOnSignOut(clerk);

    await clerk.signOut();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('joblify.profile-draft') ?? '').not.toContain('secret');
    expect(localStorage.getItem(DRAFT_OWNER_KEY)).toBeNull();
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
