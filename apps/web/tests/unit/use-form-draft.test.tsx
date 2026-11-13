// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useFormDraft } from '@/lib/use-form-draft';
import { useAuthHint } from '@/lib/stores/auth-hint';
import { DRAFT_OWNER_KEY } from '@/lib/stores/clear-drafts';

// Drafts survive a signed-out render (an expired session must get its work
// back), so restore is the gate: it must put a draft on screen only for the
// person who typed it, whatever order the header's identity and the form mount.

type Values = { headline: string; bio: string };
const initial: Values = { headline: 'saved headline', bio: 'saved bio' };
const draft = { headline: 'Alice’s half-typed headline' };

function mountForm() {
  const reset = vi.fn();
  const onRestore = vi.fn();
  const store = { getState: () => ({ draft, update: vi.fn() }) };
  const watch = vi.fn(() => ({ unsubscribe: vi.fn() }));
  renderHook(() =>
    useFormDraft<Values>({
      store,
      watch: watch as never,
      reset: reset as never,
      initial,
      onRestore,
    }),
  );
  return { reset, onRestore };
}

function signedInAs(userId: string | null | undefined) {
  act(() => useAuthHint.setState({ userId }));
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(DRAFT_OWNER_KEY, 'alice');
  useAuthHint.setState({ userId: undefined });
});

afterEach(() => {
  cleanup();
  delete (window as { Clerk?: unknown }).Clerk;
});

describe('useFormDraft restore', () => {
  it('restores nothing to a signed-out reader', () => {
    signedInAs(null);
    const { reset } = mountForm();
    expect(reset).not.toHaveBeenCalled();
  });

  it('gives the same user their draft back once they sign in again after an expired session', () => {
    signedInAs(null); // the stale /sign-in render
    const { reset, onRestore } = mountForm();
    expect(reset).not.toHaveBeenCalled();

    signedInAs('alice');
    expect(reset).toHaveBeenCalledWith({ ...initial, ...draft });
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it('restores nothing to someone else, even while the header still names the previous user', () => {
    // Bob signed in through clerk-js; the server-rendered hint has not refreshed yet.
    (window as { Clerk?: unknown }).Clerk = { loaded: true, user: { id: 'bob' } };
    signedInAs('alice');
    const { reset } = mountForm();
    expect(reset).not.toHaveBeenCalled();
  });
});
