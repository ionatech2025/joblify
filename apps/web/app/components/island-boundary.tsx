'use client';

import { Component, type ReactNode } from 'react';

/**
 * Error boundary for a single streamed island.
 *
 * `<Suspense>` handles an island that is *slow*; it does nothing for one that
 * *throws*. Without a boundary of its own, a failed query inside a streamed
 * island propagates to the nearest route-level `error.tsx` and replaces the
 * whole page — so one degraded secondary section (featured jobs, marketplace
 * counts) takes down the hero, the CTAs and the content around it too.
 *
 * Wrap non-essential islands in this so they fail in place. Pair it with
 * `<Suspense>`, outside it:
 *
 *   <IslandBoundary fallback={<EmptyState … />}>
 *     <Suspense fallback={<SkeletonList />}>
 *       <FeaturedJobs />
 *     </Suspense>
 *   </IslandBoundary>
 *
 * Must be a class component — `componentDidCatch` has no hook equivalent.
 */
export class IslandBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Sentry's global handler still reports it; this keeps the detail in the
    // browser console for local debugging without crashing the page.
    console.error('[island]', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
