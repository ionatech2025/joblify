// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthHint } from '@/app/components/auth-hint';
import { ApplyForm } from '@/app/(marketing)/jobs/[slug]/apply/apply-form';
import { BioCoachPanel } from '@/app/(authenticated)/jobseeker/profile/bio-coach-panel';
import { useApplyDraftStore } from '@/lib/stores/apply-draft';
import { useProfileDraftStore } from '@/lib/stores/profile-draft';
import { useAuthHint } from '@/lib/stores/auth-hint';
import { DRAFT_OWNER_KEY } from '@/lib/stores/clear-drafts';

vi.mock('@/app/actions/apply', () => ({ submitApplication: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

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
