import { describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { useClerkSlots, type ClerkSlotEntry } from '@/lib/stores/clerk-slots';
import { useAuthHint } from '@/lib/stores/auth-hint';

// The registry behind <ClerkSlot>/<ClerkHost>. Two properties carry the
// feature: nothing starts until something registers (a page without a Clerk
// widget never loads Clerk), and once started it stays started (a slot that
// unmounts on a client navigation must not tear the provider down).

const entry = (id: string, element: ReactNode = null): ClerkSlotEntry => ({
  id,
  // The registry never touches the node; it only hands it to createPortal.
  node: { id } as unknown as HTMLElement,
  element,
});

beforeEach(() => {
  useClerkSlots.setState({ slots: [], started: false, ready: false });
  useAuthHint.setState({ userId: undefined });
});

describe('useClerkSlots', () => {
  it('starts with nothing registered and nothing started', () => {
    const s = useClerkSlots.getState();
    expect(s.slots).toEqual([]);
    expect(s.started).toBe(false);
    expect(s.ready).toBe(false);
  });

  it('starts on the first registration', () => {
    useClerkSlots.getState().register(entry('a'));
    expect(useClerkSlots.getState().started).toBe(true);
    expect(useClerkSlots.getState().slots.map((s) => s.id)).toEqual(['a']);
  });

  it('keeps every slot, in registration order', () => {
    const { register } = useClerkSlots.getState();
    register(entry('desktop'));
    register(entry('mobile'));
    expect(useClerkSlots.getState().slots.map((s) => s.id)).toEqual(['desktop', 'mobile']);
  });

  it('replaces a slot that re-registers under the same id, rather than duplicating it', () => {
    const { register } = useClerkSlots.getState();
    register(entry('a', 'first'));
    register(entry('b'));
    register(entry('a', 'second'));
    const slots = useClerkSlots.getState().slots;
    expect(slots.map((s) => s.id)).toEqual(['b', 'a']);
    expect(slots.find((s) => s.id === 'a')?.element).toBe('second');
  });

  it('unregisters a slot but stays started', () => {
    const unregister = useClerkSlots.getState().register(entry('a'));
    unregister();
    const s = useClerkSlots.getState();
    expect(s.slots).toEqual([]);
    expect(s.started).toBe(true);
  });

  it('unregistering one slot leaves the others alone', () => {
    const { register } = useClerkSlots.getState();
    register(entry('a'));
    const unregisterB = register(entry('b'));
    unregisterB();
    expect(useClerkSlots.getState().slots.map((s) => s.id)).toEqual(['a']);
  });

  it('tracks whether clerk-js has loaded', () => {
    useClerkSlots.getState().setReady(true);
    expect(useClerkSlots.getState().ready).toBe(true);
  });
});

describe('useAuthHint', () => {
  it('is unknown until the server answers, then signed out or a user id', () => {
    expect(useAuthHint.getState().userId).toBeUndefined();
    useAuthHint.getState().setUserId(null);
    expect(useAuthHint.getState().userId).toBeNull();
    useAuthHint.getState().setUserId('user_123');
    expect(useAuthHint.getState().userId).toBe('user_123');
  });
});
