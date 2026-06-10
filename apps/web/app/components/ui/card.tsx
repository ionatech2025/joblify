export function Card({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-4 ${className}`}>{children}</div>
  );
}
