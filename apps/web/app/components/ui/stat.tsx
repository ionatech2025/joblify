import type { ReactNode } from 'react';

// Stat primitives (hero social-proof rows, dashboard summary strips):
// a heavy value over a small-caps caption, with an optional delta chip.
//
//   <StatRow>
//     <Stat value="1,240" label="Open roles" />
//     <Stat value="98%" label="Match accuracy" delta="+2.1%" />
//   </StatRow>

export function Stat({
  value,
  label,
  delta,
  deltaTone = 'up',
  className = '',
}: {
  value: ReactNode;
  label: string;
  delta?: string;
  deltaTone?: 'up' | 'down';
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline gap-2">
        <span className="display text-3xl text-neutral-900">{value}</span>
        {delta && (
          <span
            className={`text-xs font-semibold ${deltaTone === 'up' ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs font-semibold tracking-[0.14em] text-neutral-500 uppercase">
        {label}
      </div>
    </div>
  );
}

export function StatRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-10 ${className}`}>{children}</div>
  );
}
