import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

// Pill buttons. Primary is the ink register — near-black on light, near-white
// on dark (the --ink token inverts), so it is always the highest-contrast
// element on the page. Brand stays the accent for focus rings, links and
// badges rather than becoming a fill.
//
// The corner is `rounded-pill`, not `rounded-full`: --r-pill is 9999px in the
// editorial register and 4px inside .o-console, so the same Button renders as
// an editorial capsule on marketing and as an Odoo control in the back office
// with no per-call-site branching. Density in the console comes from picking
// size="sm" at the call site, not from a second variant map.
const variants: Record<Variant, string> = {
  primary: 'bg-ink text-ink-fg hover:bg-ink-hover',
  secondary: 'border border-border-strong bg-surface text-fg hover:bg-surface-sunken',
  ghost: 'text-fg-muted hover:bg-surface-sunken hover:text-fg',
  danger: 'border border-danger/30 bg-surface text-danger hover:bg-danger-subtle',
};

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

// ring-offset-canvas keeps the 2px gap around the focus ring the colour of the
// page rather than Tailwind's hardcoded white, which would read as a bright
// halo in dark mode.
const base =
  'inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-50';

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'start',
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and blocks input. Keeps the label so width doesn't jump. */
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
}) {
  const glyph = loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : icon;
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {glyph && iconPosition === 'start' ? glyph : null}
      {children}
      {glyph && iconPosition === 'end' ? glyph : null}
    </button>
  );
}

/**
 * Circular icon-only button — the arrow-in-circle affordance used for card
 * actions, carousel controls and the palette trigger. `label` is required
 * because there is no visible text to name it.
 */
export function IconButton({
  label,
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  label: string;
  variant?: Variant;
  size?: Size;
}) {
  const box: Record<Size, string> = {
    sm: 'size-8 [&_svg]:size-4',
    md: 'size-10 [&_svg]:size-[1.125rem]',
    lg: 'size-12 [&_svg]:size-5',
  };
  return (
    <button
      aria-label={label}
      className={cn(base, 'shrink-0 p-0', box[size], variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * The same look for <Link>/<a> call sites (marketing CTAs). Compose:
 * `${buttonClasses('primary', 'lg')} no-underline`.
 */
export function buttonClasses(variant: Variant = 'primary', size: Size = 'md'): string {
  return cn(base, sizes[size], variants[variant]);
}
