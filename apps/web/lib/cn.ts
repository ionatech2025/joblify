import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge ships the *default* Tailwind scales, so it has no idea that
 * `rounded-card` or `shadow-soft` are radius/shadow utilities — it would treat
 * them as unknown classes and keep both sides of a conflict, which is the exact
 * bug cn() exists to prevent.
 *
 * Registering our @theme additions here (globals.css) restores conflict
 * resolution across the whole family, including the directional variants
 * (`rounded-t-card` etc.) since they all read from the same theme key.
 *
 * Keep this in sync with the --radius-* and --shadow-* tokens in globals.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['control', 'card', 'canvas'],
      shadow: ['soft', 'raised'],
    },
  },
});

/**
 * Compose Tailwind classes with conflict resolution.
 *
 * Every UI primitive takes a `className` prop that callers use to adjust the
 * default look. Plain string concatenation appends instead of overriding, so
 * `<Card className="rounded-lg" />` used to emit both `rounded-card` and
 * `rounded-lg` and let stylesheet order pick the winner. twMerge makes the
 * caller's class win, which is what every call site already assumed.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
