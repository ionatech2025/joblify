'use client';

import dynamic from 'next/dynamic';

// Load the WebGL globe client-side only, after hydration, so cobe's JS doesn't
// compete on the critical path. The placeholder reserves the exact box (same
// aspect/size) so there's no layout shift when the globe mounts.
const Globe = dynamic(() => import('./globe').then((m) => m.Globe), {
  ssr: false,
  loading: () => <div className="mx-auto aspect-square w-full max-w-[520px]" aria-hidden="true" />,
});

export function GlobeLazy() {
  return <Globe />;
}
