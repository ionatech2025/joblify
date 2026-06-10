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

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 0;
    let width = 0;
    let raf = 0;
    const onResize = () => {
      width = canvas.offsetWidth;
    };
    window.addEventListener('resize', onResize);
    onResize();

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.25,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 12000,
      mapBrightness: 5.4,
      baseColor: [0.8, 0.82, 0.93], // cool indigo-grey landmass
      markerColor: [0.45, 0.36, 0.97], // indigo-violet markers
      glowColor: [0.9, 0.92, 1],
      markers: MARKERS,
    });

    // cobe v2 renders on update() — drive our own rAF loop for the spin.
    const tick = () => {
      phi += 0.0035;
      globe.update({ phi, width: width * 2, height: width * 2 });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    requestAnimationFrame(() => {
      canvas.style.opacity = '1';
    });

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      window.removeEventListener('resize', onResize);
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
