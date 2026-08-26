'use client';

import { useEffect, useRef } from 'react';
import createGlobe, { type Marker } from 'cobe';

// Auto-rotating dotted globe (cobe — WebGL, ~13KB). Client-only; the hero shell
// prerenders and this hydrates on top. Markers mark major hiring hubs.
const MARKERS: Marker[] = [
  { location: [51.5074, -0.1278], size: 0.06 }, // London
  { location: [52.52, 13.405], size: 0.06 }, // Berlin
  { location: [48.8566, 2.3522], size: 0.05 }, // Paris
  { location: [40.7128, -74.006], size: 0.06 }, // New York
  { location: [37.7749, -122.4194], size: 0.05 }, // San Francisco
  { location: [1.3521, 103.8198], size: 0.05 }, // Singapore
  { location: [-33.8688, 151.2093], size: 0.04 }, // Sydney
  { location: [0.3476, 32.5825], size: 0.04 }, // Kampala
];

// cobe bakes its colours in at creation, so a theme flip needs a rebuild.
function palette(dark: boolean) {
  return dark
    ? {
        dark: 1,
        diffuse: 1.4,
        mapBrightness: 6,
        baseColor: [0.16, 0.17, 0.24] as [number, number, number],
        markerColor: [0.65, 0.7, 0.99] as [number, number, number],
        glowColor: [0.16, 0.18, 0.3] as [number, number, number],
      }
    : {
        dark: 0,
        diffuse: 1.2,
        mapBrightness: 5.4,
        baseColor: [0.8, 0.82, 0.93] as [number, number, number],
        markerColor: [0.45, 0.36, 0.97] as [number, number, number],
        glowColor: [0.9, 0.92, 1] as [number, number, number],
      };
}

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = 0;
    let raf = 0;
    let globe: ReturnType<typeof createGlobe> | null = null;

    // Capped rather than the raw value: a hardcoded 2 renders 4x the pixels a
    // standard (dPR 1) display needs — pure wasted per-frame GPU work on the
    // most common desktop/external-monitor case — while still giving retina
    // screens their usual 2x. Uncapped would also let very-high-dPR phones
    // (3+) push the per-frame cost even higher for no visible gain here.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Guard the rebuild on the value that actually matters. The MutationObserver
    // below watches <html class>, which React also rewrites during hydration
    // (the next/font variable classes live there) — rebuilding on every such
    // record spins up a fresh WebGL context each time, exhausts the browser's
    // context limit and starves the main thread.
    let builtDark: boolean | null = null;
    // The rAF loop keeps recomputing the globe's rotation every frame even
    // while the tab is backgrounded, burning CPU/battery for no visible
    // result. Skip the actual update work (but keep the loop scheduled, so it
    // resumes instantly) whenever the tab is hidden.
    let hidden = document.hidden;

    // Rebuilt (not just re-styled) on theme or motion-preference change; both
    // are baked into the instance. Doing it imperatively rather than through
    // React state keeps this to a single effect with no re-render churn.
    const build = (force = false) => {
      const dark = document.documentElement.classList.contains('dark');
      if (!force && dark === builtDark) return;
      builtDark = dark;

      cancelAnimationFrame(raf);
      globe?.destroy();

      let phi = 0;
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: width * dpr,
        height: width * dpr,
        phi: 0,
        theta: 0.25,
        mapSamples: 12000,
        markers: MARKERS,
        ...palette(dark),
      });

      if (motion.matches) {
        // Reduced motion: render one frame at a slight rotation so it still
        // reads as a globe, and never start the rAF loop. CSS can't reach a
        // canvas animation, so this is the only place it can be honoured.
        globe.update({ phi: 0.6, width: width * dpr, height: width * dpr });
      } else {
        const tick = () => {
          if (!hidden) {
            phi += 0.0035;
            globe?.update({ phi, width: width * dpr, height: width * dpr });
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }
      requestAnimationFrame(() => {
        canvas.style.opacity = '1';
      });
    };

    const onResize = () => {
      width = canvas.offsetWidth;
      // The rAF loop picks the new size up on its own; the static frame can't.
      if (motion.matches) globe?.update({ phi: 0.6, width: width * dpr, height: width * dpr });
    };
    window.addEventListener('resize', onResize);
    const onVisibilityChange = () => {
      hidden = document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    width = canvas.offsetWidth;

    build(true);
    // A motion-preference flip changes the render mode, not the palette, so it
    // has to bypass the dark-only guard.
    const onMotionChange = () => build(true);
    motion.addEventListener('change', onMotionChange);
    // Fires on any <html class> write; build() decides whether it mattered.
    const themeObserver = new MutationObserver(() => build());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      cancelAnimationFrame(raf);
      globe?.destroy();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      motion.removeEventListener('change', onMotionChange);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <div className="mx-auto aspect-square w-full max-w-[520px]">
      <canvas
        ref={canvasRef}
        className="h-full w-full opacity-0 transition-opacity duration-700"
        style={{ contain: 'layout paint size' }}
        aria-hidden="true"
      />
    </div>
  );
}
