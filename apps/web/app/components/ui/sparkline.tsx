import { cn } from '@/lib/cn';

/**
 * Micro trend chart for glass metric cards. Hand-rolled inline SVG rather than
 * a charting library — a sparkline is a polyline, and pulling in a chart
 * runtime for it would cost more than every other primitive combined.
 *
 * Decorative by default (`aria-hidden`): the number it accompanies is the
 * accessible content. Pass `label` when the trend is the only place some
 * information appears, and it becomes an img-role element with that name.
 */
export function Sparkline({
  values,
  tone = 'auto',
  width = 72,
  height = 24,
  label,
  className,
}: {
  values: number[];
  /** `auto` colours by first-to-last direction. */
  tone?: 'auto' | 'up' | 'down' | 'neutral';
  width?: number;
  height?: number;
  label?: string;
  className?: string;
}) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat series would divide by zero; render it down the middle instead.
  const span = max - min || 1;
  const stepX = width / (values.length - 1);
  // Inset by the stroke half-width so the line never clips at the edges.
  const pad = 1.5;
  const usableY = height - pad * 2;

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = pad + usableY - ((v - min) / span) * usableY;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const direction = tone === 'auto' ? (last >= first ? 'up' : 'down') : tone;
  const stroke =
    direction === 'up' ? 'text-success' : direction === 'down' ? 'text-danger' : 'text-fg-subtle';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="none"
      preserveAspectRatio="none"
      className={cn('overflow-visible', stroke, className)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <polyline
        points={points.join(' ')}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
