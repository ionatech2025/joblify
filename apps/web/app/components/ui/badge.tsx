type Tone = 'brand' | 'neutral' | 'success' | 'warn' | 'dark';

// Chip/badge. `brand` is the historical default (all existing call sites);
// `dark` is the inverted price/discount chip from the ticket-card register.
const tones: Record<Tone, string> = {
  brand: 'bg-indigo-50 text-indigo-700',
  neutral: 'bg-neutral-100 text-neutral-700',
  success: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-800',
  dark: 'bg-neutral-900 text-white',
};

export function Badge({
  tone = 'brand',
  className = '',
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
