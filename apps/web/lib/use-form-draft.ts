'use client';

import { useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

/**
 * Restore-on-mount plus debounced persist for the console's long form drafts.
 *
 * The same eight lines were hand-rolled in four forms (jobseeker profile,
 * employer setup, post a job, company settings) and all four shared three
 * problems:
 *
 *   1. `useXDraftStore()` was called with no selector, so the component
 *      subscribed to the whole store and re-rendered on its own write.
 *   2. That re-render gave `draftStore` a fresh identity, and the persist
 *      effect listed it as a dependency — so react-hook-form's subscription
 *      was torn down and rebuilt on *every keystroke*. A bug, not a slow path.
 *   3. `persist` runs `JSON.stringify` over the whole draft and calls
 *      `localStorage.setItem` synchronously on the main thread, once per
 *      keystroke, which is the shape that shows up as input delay.
 *
 * This fixes all three: the store is reached through `getState()` rather than
 * a subscription, every dependency here is stable so the subscription is built
 * once, and writes are debounced. `apply-form.tsx` already had the selector
 * half right and keeps its own keyed store.
 *
 * A draft exists to survive a closed tab, not to be durable to the keystroke —
 * so a debounce costs nothing real, and the pending write is flushed on
 * unmount so navigating away still saves the last thing typed.
 */

/** The flat `{ draft, update, clear }` shape all four draft stores share. */
type DraftStoreApi<T> = {
  getState: () => { draft: Partial<T>; update: (patch: Partial<T>) => void };
};

export function useFormDraft<T extends FieldValues>({
  store,
  watch,
  reset,
  initial,
  onRestore,
  delayMs = 400,
}: {
  /** The zustand store itself — a module singleton, so a stable dependency. */
  store: DraftStoreApi<T>;
  watch: UseFormReturn<T>['watch'];
  reset: UseFormReturn<T>['reset'];
  /** Server-loaded values. A saved draft wins field-by-field over these. */
  initial: T;
  /**
   * Called when a draft was actually restored. `reset()` rebases RHF's dirty
   * baseline, so a form with a dirty bar has to be told separately that the
   * values on screen are unsaved work.
   */
  onRestore?: () => void;
  delayMs?: number;
}): void {
  // Captured at mount and deliberately never refreshed: restore happens once,
  // against the values the form was constructed with. Not writing to these
  // during render is what keeps the hook compilable by React Compiler.
  const resetRef = useRef(reset);
  const initialRef = useRef(initial);
  const onRestoreRef = useRef(onRestore);

  useEffect(() => {
    const { draft } = store.getState();
    if (Object.keys(draft).length > 0) {
      resetRef.current({ ...initialRef.current, ...draft });
      onRestoreRef.current?.();
    }
  }, [store]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: Partial<T> | undefined;

    const flush = () => {
      timer = undefined;
      if (!pending) return;
      store.getState().update(pending);
      pending = undefined;
    };

    const sub = watch((values) => {
      pending = values as Partial<T>;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    });

    return () => {
      sub.unsubscribe();
      if (timer) clearTimeout(timer);
      // Don't lose the last keystrokes to an unmount mid-debounce — that is
      // exactly the accidental navigation the draft exists for.
      flush();
    };
  }, [store, watch, delayMs]);
}
