import type { ReactNode } from 'react';

// The app's ambient design language (introduced on the landing hero): an oklch
// gradient wash + aurora blobs + edge-masked grid + starfield — all pure CSS
// (no image asset, no JS), aria-hidden, absolutely positioned. Safe inside
// PPR-cached shells and CLS-neutral (reserves no space).
//
//   hero — full treatment: wash + aurora + grid + starfield. Landing, auth,
//          error/404/offline pages.
//   band — lighter: wash + grid + a few faint dots, no aurora. Page-title
//          header bands on interior pages.
//   page — faintest: wash + masked grid only. The app-wide fixed backdrop in
//          the root layout; header/footer/cards float over it as glass/white
//          surfaces. Intensity hierarchy: hero > band > page.

const WASH =
  'linear-gradient(135deg, oklch(0.972 0.032 280) 0%, oklch(0.995 0.005 272) 50%, oklch(0.965 0.035 235) 100%)';

const AURORA =
  'radial-gradient(42% 55% at 16% 18%, oklch(0.70 0.18 288 / 0.20), transparent 70%), radial-gradient(46% 52% at 88% 26%, oklch(0.72 0.16 258 / 0.18), transparent 72%), radial-gradient(44% 48% at 72% 100%, oklch(0.78 0.13 228 / 0.14), transparent 72%)';

const GRID_LINES =
  'linear-gradient(oklch(0.45 0.05 272 / 0.07) 1px, transparent 1px), linear-gradient(90deg, oklch(0.45 0.05 272 / 0.07) 1px, transparent 1px)';

const STARFIELD_HERO =
  'radial-gradient(1.5px 1.5px at 20% 26%, oklch(0.52 0.14 288 / 0.40), transparent 50%), radial-gradient(1.5px 1.5px at 62% 16%, oklch(0.55 0.13 258 / 0.35), transparent 50%), radial-gradient(2px 2px at 81% 60%, oklch(0.58 0.12 228 / 0.32), transparent 50%), radial-gradient(1.5px 1.5px at 38% 70%, oklch(0.52 0.14 288 / 0.30), transparent 50%), radial-gradient(1.5px 1.5px at 91% 36%, oklch(0.55 0.13 258 / 0.33), transparent 50%), radial-gradient(1.5px 1.5px at 8% 64%, oklch(0.58 0.12 228 / 0.28), transparent 50%)';

const STARFIELD_BAND =
  'radial-gradient(1.5px 1.5px at 24% 38%, oklch(0.52 0.14 288 / 0.28), transparent 50%), radial-gradient(1.5px 1.5px at 68% 22%, oklch(0.55 0.13 258 / 0.24), transparent 50%), radial-gradient(1.5px 1.5px at 88% 64%, oklch(0.58 0.12 228 / 0.22), transparent 50%)';

const MASK_HERO = 'radial-gradient(ellipse 78% 68% at 50% 28%, #000 32%, transparent 80%)';
const MASK_BAND = 'radial-gradient(ellipse 90% 150% at 50% 0%, #000 40%, transparent 88%)';
const MASK_PAGE = 'radial-gradient(ellipse 95% 90% at 50% 12%, #000 25%, transparent 85%)';

export function AmbientCanvas({ variant = 'band' }: { variant?: 'hero' | 'band' | 'page' }) {
  const hero = variant === 'hero';
  const page = variant === 'page';
  const mask = hero ? MASK_HERO : page ? MASK_PAGE : MASK_BAND;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className={`absolute inset-0 ${page ? 'opacity-60' : ''}`} style={{ background: WASH }} />
      {hero && <div className="absolute inset-0" style={{ backgroundImage: AURORA }} />}
      <div
        className={`absolute inset-0 ${page ? 'opacity-70' : ''}`}
        style={{
          backgroundImage: GRID_LINES,
          backgroundSize: '56px 56px',
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      {!page && (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: hero ? STARFIELD_HERO : STARFIELD_BAND }}
        />
      )}
    </div>
  );
}

// Full-width band wrapper for custom header content (JD page, company profile).
export function AmbientBand({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden border-b border-indigo-100 ${className}`}>
      <AmbientCanvas variant="band" />
      <div className="relative">{children}</div>
    </div>
  );
}

// Standard page-title band. `width` must match the page's content max-w class
// so the title left-aligns with the content below it.
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  width = 'max-w-6xl',
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  width?: string;
}) {
  return (
    <AmbientBand>
      <div className={`mx-auto ${width} flex flex-wrap items-end justify-between gap-4 px-4 py-10 sm:px-6`}>
        <div>
          {eyebrow && <p className="eyebrow m-0 mb-2">{eyebrow}</p>}
          <h1 className="display m-0 text-2xl text-neutral-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 mb-0 text-neutral-600">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </AmbientBand>
  );
}
