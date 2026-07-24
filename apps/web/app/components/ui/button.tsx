import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

// Pill buttons. Primary is ink-black (editorial CTA); indigo stays the accent
// color for focus rings, links, and badges.
const variants: Record<Variant, string> = {
  primary: 'bg-neutral-900 text-white hover:bg-neutral-700',
  secondary: 'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50',
  ghost: 'text-neutral-700 hover:bg-neutral-100',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
};

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

// The same look for <Link>/<a> call sites (marketing CTAs). Compose:
// `${buttonClasses('primary', 'lg')} no-underline`.
export function buttonClasses(variant: Variant = 'primary', size: Size = 'md'): string {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${sizes[size]} ${variants[variant]}`;
}
