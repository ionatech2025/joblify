import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

// Stat primitives (hero social-proof rows, dashboard summary strips):
// a heavy value over a small-caps caption, with an optional delta chip,
// leading glyph capsule, and trailing sparkline.
//
//   <StatRow divided>
//     <Stat value="1,240" label="Open roles" />
//     <Stat value="98%" label="Match accuracy" delta="+2.1%" />
//   </StatRow>

export function Stat({
  value,
  label,
  delta,
  deltaTone = 'up',
  glyph,
  chart,
  className,
}: {
  value: ReactNode;
  label: string;
  delta?: string;
  deltaTone?: 'up' | 'down';
  /** Small capsule above the value — icon, avatar stack, or logo cluster. */
  glyph?: ReactNode;
  /** Trailing micro-chart (see ui/sparkline.tsx). */
  chart?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {glyph ? (
        <div className="bg-surface-sunken text-fg-muted border-border mb-3 inline-flex h-8 min-w-14 items-center justify-center gap-1 rounded-full border px-2">
          {glyph}
        </div>
      ) : null}
      <div className="flex items-baseline gap-2">
        {/* `.display.text-3xl` is asserted by tests/e2e/design-regression.spec.ts */}
        <span className="display text-fg text-3xl">{value}</span>
        {delta && (
          <span
            className={cn(
              'text-xs font-semibold',
              deltaTone === 'up' ? 'text-success' : 'text-danger',
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="caption mt-1">{label}</div>
      {chart ? <div className="mt-2">{chart}</div> : null}
    </div>
  );
}

export function StatRow({
  divided = false,
  children,
  className,
}: {
  /** Vertical hairline before each stat — the editorial ledger treatment. */
  divided?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-10',
        divided && '[&>*]:border-border [&>*]:border-l [&>*]:pl-5 sm:[&>*]:pl-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
