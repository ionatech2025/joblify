type Tone = 'default' | 'glass' | 'dark';

// Elevated rounded surface. `glass` floats over imagery/ambient washes;
// `dark` is the ink ticket-card register (light text, use sparingly).
const tones: Record<Tone, string> = {
  default: 'border-neutral-200/80 bg-white shadow-soft',
  glass: 'border-white/50 bg-white/70 shadow-soft backdrop-blur-md',
  dark: 'border-white/10 bg-neutral-950 text-white shadow-soft',
};

export function Card({
  tone = 'default',
  className = '',
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`rounded-2xl border p-4 ${tones[tone]} ${className}`}>{children}</div>;
}
