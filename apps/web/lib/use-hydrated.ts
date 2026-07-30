import { useSyncExternalStore } from 'react';

// Never fires — "have we hydrated" flips exactly once, at hydration, and
// useSyncExternalStore already re-renders then.
const subscribe = () => () => {};

/**
 * True once the component has hydrated on the client, false during SSR and the
 * first client render.
 *
 * Use it to gate anything whose server and client values legitimately differ —
 * a persisted zustand slice, `matchMedia`, `localStorage`. The naive
 * `useState(false)` + `useEffect(() => setMounted(true))` version does the same
 * thing but trips `react-hooks/set-state-in-effect` and costs an extra render.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

const DARK_SCHEME = '(prefers-color-scheme: dark)';

/**
 * Reactive `prefers-color-scheme: dark`. Returns false during SSR — callers
 * that care about the pre-hydration render should gate on `useHydrated()`.
 */
export function usePrefersDarkScheme(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DARK_SCHEME);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(DARK_SCHEME).matches,
    () => false,
  );
}
