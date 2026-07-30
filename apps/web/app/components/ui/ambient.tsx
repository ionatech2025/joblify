import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

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
//          the root layout; header/footer/cards float over it as glass/surface
//          panels. Intensity hierarchy: hero > band > page.
//
// The gradient strings themselves are tokens (--ambient-* in globals.css) so
// the whole canvas re-lights in dark mode without touching this file.

const MASK_HERO = 'radial-gradient(ellipse 78% 68% at 50% 28%, #000 32%, transparent 80%)';
const MASK_BAND = 'radial-gradient(ellipse 90% 150% at 50% 0%, #000 40%, transparent 88%)';
const MASK_PAGE = 'radial-gradient(ellipse 95% 90% at 50% 12%, #000 25%, transparent 85%)';

export function AmbientCanvas({ variant = 'band' }: { variant?: 'hero' | 'band' | 'page' }) {
  const hero = variant === 'hero';
  const page = variant === 'page';
  const mask = hero ? MASK_HERO : page ? MASK_PAGE : MASK_BAND;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className={cn('absolute inset-0', page && 'opacity-60')}
        style={{ background: 'var(--ambient-wash)' }}
      />
      {hero && (
        <div className="absolute inset-0" style={{ backgroundImage: 'var(--ambient-aurora)' }} />
      )}
      <div
        className={cn('absolute inset-0', page && 'opacity-70')}
        style={{
          backgroundImage: 'var(--ambient-grid)',
          backgroundSize: '56px 56px',
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      {!page && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: hero
              ? 'var(--ambient-starfield-hero)'
              : 'var(--ambient-starfield-band)',
          }}
        />
      )}
    </div>
  );
}

// Full-width band wrapper for custom header content (JD page, company profile).
export function AmbientBand({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('border-border relative overflow-hidden border-b', className)}>
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
      <div
        className={cn(
          'mx-auto flex flex-wrap items-end justify-between gap-4 px-4 py-10 sm:px-6',
          width,
        )}
      >
        <div>
          {eyebrow && <p className="eyebrow m-0 mb-2">{eyebrow}</p>}
          <h1 className="display text-fg m-0 text-2xl sm:text-3xl">{title}</h1>
          {subtitle && <p className="text-fg-muted mt-1 mb-0">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </AmbientBand>
  );
}
