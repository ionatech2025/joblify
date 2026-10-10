'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';

// Load the WebGL globe client-side only, after hydration, so cobe's JS doesn't
// compete on the critical path. The placeholder reserves the exact box (same
// aspect/size) so there's no layout shift when the globe mounts.
const Globe = dynamic(() => import('./globe').then((m) => m.Globe), {
  ssr: false,
  loading: () => <Box />,
});

const BOX = 'mx-auto aspect-square w-full max-w-[520px]';

function Box({ drawn = false }: { drawn?: boolean }) {
  return (
    <div className={BOX} aria-hidden="true">
      {drawn && (
        // Stands in for the globe where WebGL would be software-rendered: a
        // quiet disc in the same box, so the hero keeps its composition.
        <div
          className="border-border size-full rounded-full border"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, var(--surface), var(--surface-sunken) 70%)',
          }}
        />
      )}
    </div>
  );
}

/**
 * Whether WebGL here is backed by a GPU.
 *
 * Software rasterisers (SwiftShader, llvmpipe, WARP) are what headless Chrome —
 * Lighthouse, PageSpeed Insights, Googlebot's renderer — and some VMs, remote
 * desktops and driver-blocklisted laptops fall back to. The globe redraws every
 * frame, and under a software rasteriser each frame occupied the main thread
 * for about a second: measured on the live home page as 149 s of "Other" main
 * thread time, 200 tasks over 100 ms and a Total Blocking Time of 139 s (score
 * 32), with the page never reaching interactive. A decorative element must not
 * be able to do that, so it only runs where it is cheap.
 *
 * `failIfMajorPerformanceCaveat` is the standard probe: the context is refused
 * rather than silently handed over as software. The renderer string is checked
 * as well because not every driver stack reports the caveat.
 */
function hasHardwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;

    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info
      ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render|warp/i.test(renderer);
  } catch {
    return false;
  }
}

// Probed at most once per page: creating a context is not free, and the answer
// cannot change while the page is open.
let hardware: boolean | null = null;
const probe = () => (hardware ??= hasHardwareWebGL());

const subscribeNever = () => () => {};

export function GlobeLazy() {
  // 'pending' on the server and during hydration, so the first client render
  // matches the HTML; the probe runs on the commit after.
  const mode = useSyncExternalStore(
    subscribeNever,
    () => (probe() ? 'webgl' : 'static'),
    () => 'pending',
  );

  if (mode === 'webgl') return <Globe />;
  return <Box drawn={mode === 'static'} />;
}
