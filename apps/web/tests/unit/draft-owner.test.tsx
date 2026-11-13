// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Component, type ReactNode } from 'react';
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthHint } from '@/app/components/auth-hint';
import { ApplyForm } from '@/app/(marketing)/jobs/[slug]/apply/apply-form';
import { BioCoachPanel } from '@/app/(authenticated)/jobseeker/profile/bio-coach-panel';
import { DeleteForm } from '@/app/(authenticated)/account/delete/delete-form';
import { useApplyDraftStore } from '@/lib/stores/apply-draft';
import { useProfileDraftStore } from '@/lib/stores/profile-draft';
import { useAuthHint } from '@/lib/stores/auth-hint';
import { DRAFT_OWNER_KEY } from '@/lib/stores/clear-drafts';
import { useFormDraft } from '@/lib/use-form-draft';

vi.mock('@/app/actions/apply', () => ({ submitApplication: vi.fn() }));
const deleteMyAccount = vi.hoisted(() => vi.fn());
vi.mock('@/app/actions/account', () => ({ deleteMyAccount }));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: vi.fn() }),
}));

// Alice's session expired mid-application and she never signed out, so her
// drafts are still in this browser when the next person sits down.
const ALICE_LETTER = 'Alice’s private cover letter';
const ALICE_BIO = 'Alice’s private bio';

function aliceLeftHerDrafts() {
  localStorage.setItem(DRAFT_OWNER_KEY, 'alice');
  useApplyDraftStore.getState().update('job-x', {
    resumeId: 'r-alice',
    coverLetter: ALICE_LETTER,
    acknowledgedDataUse: true,
  });
  useProfileDraftStore.getState().update({ bio: ALICE_BIO });
}

/** Bob signs in through clerk-js; the header still carries the signed-out /sign-in render. */
function bobJustSignedIn() {
  (window as { Clerk?: unknown }).Clerk = { loaded: true, user: { id: 'bob' } };
  render(<AuthHint userId={null} />);
}

const applyForm = (
  <ApplyForm jobId="job-x" jobSlug="x" resumes={[{ id: 'r-bob', title: 'Bob CV' }]} />
);
const coverLetter = () =>
  screen.getByRole('textbox', { name: /cover letter/i }) as HTMLTextAreaElement;

beforeEach(() => {
  localStorage.clear();
  useApplyDraftStore.setState({ byJob: {} });
  useProfileDraftStore.setState({ draft: {} });
  useAuthHint.setState({ userId: undefined });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete (window as { Clerk?: unknown }).Clerk;
});

describe('ApplyForm with a previous person’s draft in the browser', () => {
  it('shows someone who just signed in none of it', () => {
    aliceLeftHerDrafts();
    bobJustSignedIn();
    render(applyForm);

    expect(coverLetter().value).toBe('');
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  });

  it('gives the owner their draft back', () => {
    aliceLeftHerDrafts();
    render(<AuthHint userId="alice" />);
    render(applyForm);

    expect(coverLetter().value).toBe(ALICE_LETTER);
  });

  it('never overwrites the saved letter with typing done before the owner is known', async () => {
    aliceLeftHerDrafts();
    render(applyForm);
    await userEvent.type(coverLetter(), 'x');

    expect(useApplyDraftStore.getState().get('job-x').coverLetter).toBe(ALICE_LETTER);
    act(() => useAuthHint.setState({ userId: 'alice' }));
    expect(coverLetter().value).toBe(ALICE_LETTER);
  });
});

describe('BioCoachPanel with a previous person’s draft in the browser', () => {
  async function askTheCoach() {
    const fetchMock = vi.fn(async () => new Response('', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<BioCoachPanel currentBio="Bob’s saved bio" onClose={() => {}} />);
    await userEvent.type(screen.getByRole('textbox', { name: /ask the bio coach/i }), 'shorter');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    return JSON.parse(String(init.body)) as { currentBio: string };
  }

  it('sends the signed-in person’s saved bio, not the draft someone else left', async () => {
    aliceLeftHerDrafts();
    bobJustSignedIn();
    expect((await askTheCoach()).currentBio).toBe('Bob’s saved bio');
  });

  it('sends the owner’s unsaved draft bio', async () => {
    aliceLeftHerDrafts();
    render(<AuthHint userId="alice" />);
    expect((await askTheCoach()).currentBio).toBe(ALICE_BIO);
  });
});

describe('a second open tab', () => {
  /** What this tab sees when another tab of the same browser writes storage. */
  function anotherTabSets(key: string, newValue: string | null) {
    const oldValue = localStorage.getItem(key);
    if (newValue === null) localStorage.removeItem(key);
    else localStorage.setItem(key, newValue);
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key, oldValue, newValue, storageArea: localStorage }),
      );
    });
  }

  function mountProfileForm() {
    const reset = vi.fn();
    renderHook(() =>
      useFormDraft<{ bio: string }>({
        store: useProfileDraftStore,
        watch: (() => ({ unsubscribe: () => {} })) as never,
        reset: reset as never,
        initial: { bio: 'Bob’s saved bio' },
      }),
    );
    return reset;
  }

  it('drops the previous person’s drafts from memory when another tab signs someone else in', () => {
    const { rerender } = render(<AuthHint userId="alice" />);
    aliceLeftHerDrafts();

    // The other tab: Alice signs out, which wipes storage, then Bob signs in.
    anotherTabSets('joblify.profile-draft', null);
    anotherTabSets('joblify.apply-draft', null);
    anotherTabSets(DRAFT_OWNER_KEY, null);
    anotherTabSets(DRAFT_OWNER_KEY, 'bob');
    // This tab refreshes as Bob.
    rerender(<AuthHint userId="bob" />);

    expect(mountProfileForm()).not.toHaveBeenCalled();
    render(applyForm);
    expect(coverLetter().value).toBe('');
  });

  it('drops a draft from memory when another tab removes it from storage', () => {
    render(<AuthHint userId="alice" />);
    aliceLeftHerDrafts();
    anotherTabSets('joblify.apply-draft', null);
    expect(useApplyDraftStore.getState().byJob).toEqual({});
  });

  it('keeps this tab’s drafts when another tab of the same person saves its own', () => {
    render(<AuthHint userId="alice" />);
    aliceLeftHerDrafts();
    anotherTabSets('joblify.apply-draft', JSON.stringify({ state: { byJob: {} }, version: 1 }));
    expect(useProfileDraftStore.getState().draft.bio).toBe(ALICE_BIO);
    expect(useApplyDraftStore.getState().get('job-x').coverLetter).toBe(ALICE_LETTER);
  });
});

describe('deleting the account', () => {
  class Boundary extends Component<{ children: ReactNode }, { caught: boolean }> {
    state = { caught: false };
    static getDerivedStateFromError() {
      return { caught: true };
    }
    render() {
      return this.state.caught ? <p>navigated away</p> : this.props.children;
    }
  }

  it('wipes every draft in this browser along with the account', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<AuthHint userId="alice" />);
    aliceLeftHerDrafts();
    // Success ends in a server-side redirect, which Next delivers to the caller
    // as a rejected action promise.
    deleteMyAccount.mockRejectedValue(
      Object.assign(new Error('NEXT_REDIRECT'), {
        digest: 'NEXT_REDIRECT;push;/?account_deleted=1;303;',
      }),
    );
    render(
      <Boundary>
        <DeleteForm expectedConfirmation="alice@example.com" />
      </Boundary>,
    );
    await userEvent.type(screen.getByRole('textbox'), 'alice@example.com');
    await userEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    await screen.findByText('navigated away');

    expect(useProfileDraftStore.getState().draft).toEqual({});
    expect(useApplyDraftStore.getState().byJob).toEqual({});
    expect(localStorage.getItem('joblify.profile-draft') ?? '').not.toContain('Alice');
    expect(localStorage.getItem('joblify.apply-draft') ?? '').not.toContain('Alice');
    expect(localStorage.getItem(DRAFT_OWNER_KEY)).toBeNull();
  });
});
